import { Component, ComponentFactory, ComponentFactoryResolver, ComponentRef, Type, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GameComponent } from '../game-components/game-component/GameComponent';
import { GameIncluderComponent } from '../game-components/game-includer/game-includer.component';
import { UserService } from '../../services/UserService';
import { AuthenticationService } from 'src/app/services/AuthenticationService';

import { Move } from '../../jscaip/Move';
import { AbstractGameState } from 'src/app/jscaip/GameState';
import { LegalityStatus } from 'src/app/jscaip/LegalityStatus';
import { MGPValidation } from 'src/app/utils/MGPValidation';
import { assert, display } from 'src/app/utils/utils';
import { GameInfo } from '../normal-component/pick-game/pick-game.component';
import { Player } from 'src/app/jscaip/Player';
import { Rules } from 'src/app/jscaip/Rules';
import { Localized } from 'src/app/utils/LocaleUtils';

export class GameWrapperMessages {

    public static readonly NOT_YOUR_TURN: Localized = () => $localize`It is not your turn!`;

    public static readonly NO_CLONING_FEATURE: Localized = () => $localize`You cannot clone a game. This feature might be implemented later.`;
}
export abstract class AbstractRules extends Rules<Move, AbstractGameState> {
}

@Component({ template: '' })
export abstract class GameWrapper {

    public static VERBOSE: boolean = false;

    // component loading
    @ViewChild(GameIncluderComponent)
    public gameIncluder: GameIncluderComponent;

    public gameComponent: GameComponent<AbstractRules, Move, AbstractGameState>;

    public userName: string = this.authenticationService.getAuthenticatedUser() != null &&
                              this.authenticationService.getAuthenticatedUser().pseudo // TODO, clean that;

    public players: string[] = [null, null];

    public observerRole: number;

    public canPass: boolean;

    public endGame: boolean = false;

    constructor(protected componentFactoryResolver: ComponentFactoryResolver,
                protected actRoute: ActivatedRoute,
                public router: Router,
                protected userService: UserService,
                protected authenticationService: AuthenticationService)
    {
        display(GameWrapper.VERBOSE, 'GameWrapper.constructed: ' + (this.gameIncluder!=null));
    }
    public getMatchingComponent(compoString: string)
    : Type<GameComponent<AbstractRules, Move, AbstractGameState>>
    {
        display(GameWrapper.VERBOSE, 'GameWrapper.getMatchingComponent');
        const gameInfo: GameInfo = GameInfo.ALL_GAMES().find((gameInfo: GameInfo) => gameInfo.urlName === compoString);
        if (gameInfo == null) {
            throw new Error('Unknown Games are unwrappable');
        }
        return gameInfo.component;
    }
    protected afterGameIncluderViewInit(): void {
        display(GameWrapper.VERBOSE, 'GameWrapper.afterGameIncluderViewInit');

        this.createGameComponent();

        this.gameComponent.rules.setInitialBoard();
    }
    protected createGameComponent(): void {
        display(GameWrapper.VERBOSE, 'GameWrapper.createGameComponent');
        assert(this.gameIncluder != null, 'GameIncluder should be present');

        const compoString: string = this.actRoute.snapshot.paramMap.get('compo');
        const component: Type<GameComponent<AbstractRules, Move, AbstractGameState>> =
            this.getMatchingComponent(compoString);
        const componentFactory: ComponentFactory<GameComponent<AbstractRules, Move, AbstractGameState>> =
            this.componentFactoryResolver.resolveComponentFactory(component);
        const componentRef: ComponentRef<GameComponent<AbstractRules, Move, AbstractGameState>> =
            this.gameIncluder.viewContainerRef.createComponent(componentFactory);
        this.gameComponent = <GameComponent<AbstractRules, Move, AbstractGameState>>componentRef.instance;
        // Shortent by T<S = Truc>

        this.gameComponent.chooseMove = this.receiveValidMove; // so that when the game component do a move
        // the game wrapper can then act accordingly to the chosen move.
        this.gameComponent.canUserPlay = this.onUserClick; // So that when the game component click
        // the game wrapper can act accordly
        this.gameComponent.isPlayerTurn = this.isPlayerTurn;
        this.gameComponent.cancelMoveOnWrapper = this.onCancelMove; // Mostly for interception by TutorialGameWrapper

        this.gameComponent.observerRole = this.observerRole;
        this.canPass = this.gameComponent.canPass;
    }
    public receiveValidMove: (m: Move,
                              s: AbstractGameState,
                              s0: number,
                              s1: number) => Promise<MGPValidation> =
    async(move: Move,
          state: AbstractGameState,
          scorePlayerZero: number,
          scorePlayerOne: number): Promise<MGPValidation> =>
    {
        const LOCAL_VERBOSE: boolean = false;
        display(GameWrapper.VERBOSE || LOCAL_VERBOSE, {
            gameWrapper_receiveValidMove_AKA_chooseMove: {
                move,
                state,
                scorePlayerZero,
                scorePlayerOne,
            },
        });
        if (!this.isPlayerTurn()) {
            return MGPValidation.failure(GameWrapperMessages.NOT_YOUR_TURN());
        }
        if (this.endGame) {
            return MGPValidation.failure($localize`The game has ended.`);
        }
        const legality: LegalityStatus = this.gameComponent.rules.isLegal(move, state);
        if (legality.legal.isFailure()) {
            this.gameComponent.cancelMove(legality.legal.getReason());
            return legality.legal;
        }
        this.gameComponent.cancelMoveAttempt();
        await this.onLegalUserMove(move, scorePlayerZero, scorePlayerOne);
        display(GameWrapper.VERBOSE || LOCAL_VERBOSE, 'GameWrapper.receiveValidMove says: valid move legal');
        return MGPValidation.SUCCESS;
    }
    public abstract onLegalUserMove(move: Move, scorePlayerZero: number, scorePlayerOne: number): Promise<void>;

    public onUserClick: (elementName: string) => MGPValidation = (_elementName: string) => {
        // TODO: Not the same logic to use in Online and Local, make abstract
        if (this.observerRole === Player.NONE.value) {
            const message: string = GameWrapperMessages.NO_CLONING_FEATURE();
            return MGPValidation.failure(message);
        }
        if (this.isPlayerTurn()) {
            return MGPValidation.SUCCESS;
        } else {
            return MGPValidation.failure(GameWrapperMessages.NOT_YOUR_TURN());
        }
    }
    public onCancelMove(): void {
        // Non needed by default'
    }
    public isPlayerTurn: () => boolean = () => {
        if (this.observerRole === Player.NONE.value) {
            return false;
        }
        const turn: number = this.gameComponent.rules.node.gameState.turn;
        const indexPlayer: number = turn % 2;
        display(GameWrapper.VERBOSE, { isPlayerTurn: {
            turn,
            players: this.players,
            username: this.userName,
            observer: this.observerRole,
            areYouPlayer: (this.players[indexPlayer] && this.players[indexPlayer] === this.userName),
            isThereAPlayer: this.players[indexPlayer],
        } });
        if (this.players[indexPlayer]) {
            return this.players[indexPlayer] === this.userName ||
                   this.players[indexPlayer] === 'humain';
        } else {
            return true;
        }
    }
}
