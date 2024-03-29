import { Component } from '@angular/core';

import { TriangularGameComponent }
    from 'src/app/components/game-components/game-component/TriangularGameComponent';
import { Coord } from 'src/app/jscaip/Coord';
import { SaharaMove } from 'src/app/games/sahara/SaharaMove';
import { SaharaState } from 'src/app/games/sahara/SaharaState';
import { SaharaRules } from 'src/app/games/sahara/SaharaRules';
import { SaharaMinimax } from 'src/app/games/sahara/SaharaMinimax';
import { MGPValidation } from 'src/app/utils/MGPValidation';
import { MGPOptional } from 'src/app/utils/MGPOptional';
import { Player } from 'src/app/jscaip/Player';
import { MessageDisplayer } from 'src/app/services/message-displayer/MessageDisplayer';
import { SaharaFailure } from './SaharaFailure';
import { FourStatePiece } from 'src/app/jscaip/FourStatePiece';
import { SaharaTutorial } from './SaharaTutorial';
import { MGPFallible } from 'src/app/utils/MGPFallible';

@Component({
    selector: 'app-sahara',
    templateUrl: './sahara.component.html',
    styleUrls: ['../../components/game-components/game-component/game-component.scss'],
})
export class SaharaComponent extends TriangularGameComponent<SaharaRules,
                                                             SaharaMove,
                                                             SaharaState,
                                                             FourStatePiece>
{
    public static VERBOSE: boolean = false;

    public lastCoord: MGPOptional<Coord> = MGPOptional.empty();

    public lastMoved: MGPOptional<Coord> = MGPOptional.empty();

    public chosenCoord: MGPOptional<Coord> = MGPOptional.empty();

    public constructor(messageDisplayer: MessageDisplayer) {
        super(messageDisplayer);
        this.rules = new SaharaRules(SaharaState);
        this.availableMinimaxes = [
            new SaharaMinimax(this.rules, 'SaharaMinimax'),
        ];
        this.encoder = SaharaMove.encoder;
        this.tutorial = new SaharaTutorial().tutorial;
        this.updateBoard();
    }
    public cancelMoveAttempt(): void {
        this.chosenCoord = MGPOptional.empty();
    }
    public async onClick(x: number, y: number): Promise<MGPValidation> {
        const clickValidity: MGPValidation = this.canUserPlay('#click_' + x + '_' + y);
        if (clickValidity.isFailure()) {
            return this.cancelMove(clickValidity.getReason());
        }
        if (this.chosenCoord.isAbsent()) { // Must select pyramid
            return this.choosePiece(x, y);
        } else { // Must choose empty landing case
            return this.chooseLandingCoord(x, y);
        }
    }
    private choosePiece(x: number, y: number): MGPValidation {
        if (this.board[y][x] === FourStatePiece.EMPTY) { // Did not select pyramid
            return this.cancelMove(SaharaFailure.MUST_CHOOSE_PYRAMID_FIRST());
        } else if (this.board[y][x].value === this.getTurn() % 2) { // selected his own pyramid
            this.chosenCoord = MGPOptional.of(new Coord(x, y));
            return MGPValidation.SUCCESS;
        } else { // Selected opponent pyramid
            return this.cancelMove(SaharaFailure.MUST_CHOOSE_OWN_PYRAMID());
        }
    }
    private async chooseLandingCoord(x: number, y: number): Promise<MGPValidation> {
        const clickedCoord: Coord = new Coord(x, y);
        const currentPlayer: Player = this.rules.node.gameState.getCurrentPlayer();
        const player: FourStatePiece = FourStatePiece.ofPlayer(currentPlayer);
        if (this.board[y][x] === player) {
            this.chosenCoord = MGPOptional.of(new Coord(x, y));
            return MGPValidation.SUCCESS;
        }
        const newMove: MGPFallible<SaharaMove> = SaharaMove.from(this.chosenCoord.get(), clickedCoord);
        if (newMove.isFailure()) {
            return this.cancelMove(newMove.getReason());
        }
        return await this.chooseMove(newMove.get(), this.rules.node.gameState);
    }
    public updateBoard(): void {
        this.chosenCoord = MGPOptional.empty();
        const move: MGPOptional<SaharaMove> = this.rules.node.move;
        this.lastCoord = move.map((move: SaharaMove) => move.coord);
        this.lastMoved = move.map((move: SaharaMove) => move.end);
        this.board = this.rules.node.gameState.board;
    }
    public getPlayerClassFor(x: number, y: number): string {
        const piece: FourStatePiece = this.board[y][x];
        return this.getPlayerClass(Player.of(piece.value));
    }
}
