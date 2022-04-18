import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PartDAO } from 'src/app/dao/PartDAO';
import { AuthenticationService, AuthUser } from 'src/app/services/AuthenticationService';
import { GameService } from 'src/app/services/GameService';
import { MessageDisplayer } from 'src/app/services/MessageDisplayer';
import { Localized } from 'src/app/utils/LocaleUtils';
import { Utils } from 'src/app/utils/utils';
import { assert } from 'src/app/utils/assert';
import { MGPOptional } from 'src/app/utils/MGPOptional';
import { GameInfo } from '../pick-game/pick-game.component';
import { GameWrapperMessages } from '../../wrapper-components/GameWrapper';
import { MinimalUser } from 'src/app/domain/MinimalUser';

export class OnlineGameCreationMessages {
    public static readonly ALREADY_INGAME: Localized = () => $localize`You are already in a game. Finish it or cancel it first.`;
}

@Component({
    selector: 'app-online-game-creation',
    template: '<p i18n>Creating online game, please wait, it should not take long.</p>',
})
export class OnlineGameCreationComponent implements OnInit {

    public constructor(private readonly route: ActivatedRoute,
                       private readonly router: Router,
                       private readonly authenticationService: AuthenticationService,
                       private readonly messageDisplayer: MessageDisplayer,
                       private readonly partDAO: PartDAO,
                       private readonly gameService: GameService) {
    }
    public async ngOnInit(): Promise<void> {
        await this.createGameAndRedirectOrShowError(this.extractGameFromURL());
    }
    private extractGameFromURL(): string {
        return Utils.getNonNullable(this.route.snapshot.paramMap.get('compo'));
    }
    private async createGameAndRedirectOrShowError(game: string): Promise<boolean> {
        const user: AuthUser = this.authenticationService.user.get();
        assert(user.isConnected(), 'User must be connected and have a username to reach this page');
        const username: string = user.username.get();
        if (this.gameExists(game) === false) {
            await this.router.navigate(['/notFound', GameWrapperMessages.NO_MATCHING_GAME(game)], { skipLocationChange: true });
            return false;
        }
        if (await this.canCreateOnlineGame(username)) {
            const creator: MinimalUser = user.toMinimalUser();
            const gameId: string = await this.gameService.createPartJoinerAndChat(creator, game);
            // create Part and Joiner
            await this.router.navigate(['/play', game, gameId]);
            return true;
        } else {
            this.messageDisplayer.infoMessage(OnlineGameCreationMessages.ALREADY_INGAME());
            await this.router.navigate(['/lobby']);
            return false;
        }
    }
    private gameExists(gameName: string): boolean {
        const gameInfo: MGPOptional<GameInfo> =
            MGPOptional.ofNullable(GameInfo.ALL_GAMES().find((gameInfo: GameInfo) => gameInfo.urlName === gameName));
        return gameInfo.isPresent();
    }
    private async canCreateOnlineGame(username: string): Promise<boolean> {
        const hasActivePart: boolean = await this.partDAO.userHasActivePart(username);
        return hasActivePart === false;
    }
}
