import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FirstPlayer, IFirstPlayer, IJoiner, IJoinerId, IPartType, PartStatus, PartType } from '../../../domain/ijoiner';
import { Router } from '@angular/router';
import { GameService } from '../../../services/GameService';
import { JoinerService } from '../../../services/JoinerService';
import { ChatService } from '../../../services/ChatService';
import { assert, display, Utils } from 'src/app/utils/utils';
import { MGPMap } from 'src/app/utils/MGPMap';
import { UserService } from 'src/app/services/UserService';
import { IUser, IUserId } from 'src/app/domain/iuser';
import { FirebaseCollectionObserver } from 'src/app/dao/FirebaseCollectionObserver';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { MessageDisplayer } from 'src/app/services/message-displayer/MessageDisplayer';

interface PartCreationViewInfo {
    userIsCreator: boolean;
    showCustomTime?: boolean;
    canEditConfig?: boolean;
    canProposeConfig?: boolean;
    canReviewConfig?: boolean;

    userIsChosenOpponent: boolean;
    creatorIsModifyingConfig?: boolean;
    userIsObserver: boolean;

    creator?: string;
    firstPlayer: IFirstPlayer;
    firstPlayerClasses: { [key: string]: string[] },
    partType: IPartType;
    partTypeClasses: { [key: string]: string[] },
    partTypeName?: string,
    maximalMoveDuration?: number;
    totalPartDuration?: number;
    candidates: string[];
    chosenOpponent?: string;
    candidateClasses: { [key: string]: string[] },
}
@Component({
    selector: 'app-part-creation',
    templateUrl: './part-creation.component.html',
})
export class PartCreationComponent implements OnInit, OnDestroy {
    /*
     * Lifecycle:
     * 1. Creator chooses config and opponent
     * 2. Creator click on "proposing the config"
     * 3a. Chosen opponent accepts the config -> part starts
     * 3b. Creator clicks on "modifying config" -> back to 1, with the current config and opponent
     *
     * PageCreationComponent is always a child of OnlineGame component (one to one)
     * they need common data so that the parent calculates/retrieves the data then share it
     * with the part creation component
     */
    public static VERBOSE: boolean = false;

    public partType: typeof PartType = PartType;

    @Input() partId: string;
    @Input() userName: string;

    @Output('gameStartNotification') gameStartNotification: EventEmitter<IJoiner> = new EventEmitter<IJoiner>();
    public gameStarted: boolean = false;
    // notify that the game has started, a thing evaluated with the joiner doc game status

    public viewInfo: PartCreationViewInfo = {
        userIsCreator: false,
        userIsChosenOpponent: false,
        userIsObserver: false,
        partType: 'STANDARD',
        partTypeClasses: { 'STANDARD': ['is-selected', 'is-primary'], 'BLITZ': [], 'CUSTOM': [] },
        firstPlayer: 'RANDOM',
        firstPlayerClasses: { 'CREATOR': [], 'RANDOM': ['is-selected', 'is-primary'], 'CHOSEN_PLAYER': [] },
        candidateClasses: {},
        candidates: [],
    }
    public currentJoiner: IJoiner | null = null;

    // Subscription
    private candidateSubscription: MGPMap<string, () => void> = new MGPMap();
    private creatorSubscription: (() => void) | null = null;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    public configFormGroup: FormGroup;

    public allDocDeleted: boolean = false;

    public constructor(public router: Router,
                       public gameService: GameService,
                       public joinerService: JoinerService,
                       public chatService: ChatService,
                       public userService: UserService,
                       public formBuilder: FormBuilder,
                       public messageDisplayer: MessageDisplayer)
    {
        display(PartCreationComponent.VERBOSE, 'PartCreationComponent constructed for ' + this.userName);
    }
    public async ngOnInit(): Promise<void> {
        display(PartCreationComponent.VERBOSE, 'PartCreationComponent.ngOnInit for ' + this.userName);

        this.checkInputs();
        this.createForms();
        const gameExists: boolean = await this.joinerService.joinGame(this.partId, this.userName);
        if (gameExists === false) {
            // We will be redirected by the GameWrapper
            return;
        }
        this.subscribeToJoinerDoc();
        this.subscribeToFormElements();

        display(PartCreationComponent.VERBOSE, 'PartCreationComponent.ngOnInit asynchronouseries finisheds');
        return;
    }
    private checkInputs() {
        assert(this.userName != null && this.userName !== '',
               'PartCreationComponent should not be created with an empty userName');
        assert(this.partId != null && this.partId !== '',
               'PartCreationComponent should not be created with an empty partId');
    }
    private createForms() {
        this.configFormGroup = this.formBuilder.group({
            firstPlayer: [FirstPlayer.RANDOM.value, Validators.required],
            maximalMoveDuration: [PartType.NORMAL_MOVE_DURATION, Validators.required],
            partType: ['STANDARD', Validators.required],
            totalPartDuration: [PartType.NORMAL_PART_DURATION, Validators.required],
            chosenOpponent: ['', Validators.required],
        });
    }
    private subscribeToJoinerDoc(): void {
        this.joinerService
            .observe(this.partId)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((joinerId: IJoinerId) => {
                this.onCurrentJoinerUpdate(joinerId);
            });
    }
    private getForm(name: string): AbstractControl {
        return Utils.getNonNullable(this.configFormGroup.get(name));
    }
    private subscribeToFormElements(): void {
        this.getForm('chosenOpponent').valueChanges
            .pipe(takeUntil(this.ngUnsubscribe)).subscribe((opponent: string) => {
                if (this.viewInfo.chosenOpponent !== undefined) {
                    this.viewInfo.candidateClasses[this.viewInfo.chosenOpponent] = [];
                }
                this.viewInfo.candidateClasses[opponent] = ['is-selected'];
                this.viewInfo.chosenOpponent = opponent;
                this.viewInfo.canProposeConfig =
                    Utils.getNonNullable(this.currentJoiner).partStatus !== PartStatus.CONFIG_PROPOSED.value &&
                    opponent !== '';
            });
        this.getForm('partType').valueChanges
            .pipe(takeUntil(this.ngUnsubscribe)).subscribe((partType: IPartType) => {
                this.viewInfo.partTypeClasses[this.viewInfo.partType] = [];
                this.viewInfo.partTypeClasses[partType] = ['is-primary', 'is-selected'];
                this.viewInfo.partType = partType;
                this.viewInfo.showCustomTime = partType === 'CUSTOM';
            });
        this.getForm('maximalMoveDuration').valueChanges
            .pipe(takeUntil(this.ngUnsubscribe)).subscribe((maximalMoveDuration: number) => {
                this.viewInfo.maximalMoveDuration = maximalMoveDuration;
            });
        this.getForm('totalPartDuration').valueChanges
            .pipe(takeUntil(this.ngUnsubscribe)).subscribe((totalPartDuration: number) => {
                this.viewInfo.totalPartDuration = totalPartDuration;
            });
        this.getForm('firstPlayer').valueChanges
            .pipe(takeUntil(this.ngUnsubscribe)).subscribe((firstPlayer: IFirstPlayer) => {
                this.viewInfo.firstPlayerClasses[this.viewInfo.firstPlayer] = [];
                this.viewInfo.firstPlayerClasses[firstPlayer] = ['is-primary', 'is-selected'];
                this.viewInfo.firstPlayer = firstPlayer;
            });
    }
    private updateViewInfo(joinerId: IJoinerId): void {
        const joiner: IJoiner = joinerId.doc;

        this.viewInfo.canReviewConfig = joiner.partStatus === PartStatus.CONFIG_PROPOSED.value;
        this.viewInfo.canEditConfig = joiner.partStatus !== PartStatus.CONFIG_PROPOSED.value;
        this.viewInfo.userIsCreator = this.userName === joiner.creator;
        this.viewInfo.userIsChosenOpponent = this.userName === joiner.chosenPlayer;
        this.viewInfo.userIsObserver =
                this.viewInfo.userIsChosenOpponent === false && this.viewInfo.userIsCreator === false;
        this.viewInfo.creatorIsModifyingConfig = joiner.partStatus !== PartStatus.CONFIG_PROPOSED.value;
        this.viewInfo.showCustomTime = this.getForm('partType').value === 'CUSTOM';

        this.viewInfo.creator = joiner.creator;
        this.viewInfo.candidates = joiner.candidates;
        if (this.userName === joiner.creator) {
            this.setDataForCreator(joiner);
        } else {
            this.viewInfo.maximalMoveDuration = joiner.maximalMoveDuration;
            this.viewInfo.totalPartDuration = joiner.totalPartDuration;
            this.viewInfo.partType = joiner.partType;
            this.viewInfo.chosenOpponent = joiner.chosenPlayer || undefined;
            this.viewInfo.firstPlayer = joiner.firstPlayer;
        }
        switch (joiner.partType) {
            case 'CUSTOM':
                this.viewInfo.partTypeName = $localize`custom`;
                break;
            case 'BLITZ':
                this.viewInfo.partTypeName = $localize`blitz`;
                break;
            case 'STANDARD':
                this.viewInfo.partTypeName = $localize`standard`;
                break;
        }
    }
    private setDataForCreator(joiner: IJoiner): void {
        this.viewInfo.maximalMoveDuration = this.viewInfo.maximalMoveDuration || joiner.maximalMoveDuration;
        this.viewInfo.totalPartDuration = this.viewInfo.totalPartDuration || joiner.totalPartDuration;
        let opponent: string | undefined = this.viewInfo.chosenOpponent;
        if (opponent) {
            if (joiner.candidates.indexOf(opponent) === -1) {
                opponent = ''; // chosenOppoent left
            }
        } else {
            opponent = joiner.chosenPlayer || '';
        }
        this.getForm('chosenOpponent').setValue(opponent);
    }
    public selectFirstPlayer(firstPlayer: IFirstPlayer): void {
        this.getForm('firstPlayer').setValue(firstPlayer);
    }
    public selectPartType(partType: IPartType): void {
        if (partType === 'STANDARD') {
            this.getForm('maximalMoveDuration').setValue(PartType.NORMAL_MOVE_DURATION);
            this.getForm('totalPartDuration').setValue(PartType.NORMAL_PART_DURATION);
        } else if (partType === 'BLITZ') {
            this.getForm('maximalMoveDuration').setValue(PartType.BLITZ_MOVE_DURATION);
            this.getForm('totalPartDuration').setValue(PartType.BLITZ_PART_DURATION);
        }
        this.getForm('partType').setValue(partType);
    }
    public async selectOpponent(player: string): Promise<void> {
        display(PartCreationComponent.VERBOSE, 'PartCreationComponent.setChosenPlayer(' + player + ')');
        return this.joinerService.setChosenPlayer(player);
    }
    public async changeConfig(): Promise<void> {
        return this.joinerService.reviewConfig();
    }
    public async proposeConfig(): Promise<void> {
        const chosenPlayer: string = this.getForm('chosenOpponent').value;
        const partType: string = this.getForm('partType').value;
        const maxMoveDur: number = this.getForm('maximalMoveDuration').value;
        const firstPlayer: string = this.getForm('firstPlayer').value;
        const totalPartDuration: number = this.getForm('totalPartDuration').value;
        return this.joinerService.proposeConfig(chosenPlayer,
                                                PartType.of(partType),
                                                maxMoveDur,
                                                FirstPlayer.of(firstPlayer),
                                                totalPartDuration);
    }
    public async cancelGameCreation(): Promise<void> {
        this.allDocDeleted = true;
        display(PartCreationComponent.VERBOSE, 'PartCreationComponent.cancelGameCreation');

        await this.gameService.deletePart(this.partId);
        display(PartCreationComponent.VERBOSE, 'PartCreationComponent.cancelGameCreation: game deleted');

        await this.joinerService.deleteJoiner();
        display(PartCreationComponent.VERBOSE, 'PartCreationComponent.cancelGameCreation: game and joiner deleted');

        await this.chatService.deleteChat(this.partId);
        display(PartCreationComponent.VERBOSE,
                'PartCreationComponent.cancelGameCreation: game and joiner and chat deleted');
        return;
    }
    private onCurrentJoinerUpdate(iJoinerId: IJoinerId) {
        display(PartCreationComponent.VERBOSE,
                { PartCreationComponent_onCurrentJoinerUpdate: {
                    before: JSON.stringify(this.currentJoiner),
                    then: JSON.stringify(iJoinerId) } });
        if (this.isGameCancelled(iJoinerId)) {
            display(PartCreationComponent.VERBOSE, 'PartCreationComponent.onCurrentJoinerUpdate: LAST UPDATE : the game is cancelled');
            return this.onGameCancelled();
        } else {
            this.observeNeededPlayers(iJoinerId.doc);
            this.currentJoiner = iJoinerId.doc;
            this.updateViewInfo(iJoinerId);
            if (this.isGameStarted(iJoinerId.doc)) {
                display(PartCreationComponent.VERBOSE, 'PartCreationComponent.onCurrentJoinerUpdate: the game has started');
                this.onGameStarted(iJoinerId.doc);
            }
        }
    }
    private isGameCancelled(joinerId: IJoinerId): boolean {
        return (joinerId == null) || (joinerId.doc == null);
    }
    private onGameCancelled() {
        display(PartCreationComponent.VERBOSE, 'PartCreationComponent.onGameCancelled');
        this.messageDisplayer.infoMessage($localize`The game has been canceled!`);
        this.router.navigate(['server']);
    }
    private isGameStarted(joiner: IJoiner): boolean {
        return joiner != null && joiner.partStatus === PartStatus.PART_STARTED.value;
    }
    private onGameStarted(joiner: IJoiner) {
        display(PartCreationComponent.VERBOSE, { partCreationComponent_onGameStarted: { joiner } });

        this.gameStartNotification.emit(joiner);
        this.gameStarted = true;
        display(PartCreationComponent.VERBOSE, 'PartCreationComponent.onGameStarted finished');
    }
    private observeNeededPlayers(joiner: IJoiner): void {
        display(PartCreationComponent.VERBOSE, { PartCreationComponent_updateJoiner: { joiner } });

        if (this.userName === joiner.creator) {
            this.observeCandidates(joiner);
        } else {
            this.observeCreator(joiner);
        }
    }
    private observeCreator(joiner: IJoiner): void {
        if (this.creatorSubscription != null) {
            // We are already observing the creator
            return;
        }
        const destroyDocIfCreatorOffline: (modifiedUsers: IUserId[]) => void = (modifiedUsers: IUserId[]) => {
            for (const user of modifiedUsers) {
                assert(user.doc.username === joiner.creator, 'found non creator while observing creator!');
                if (user.doc.state === 'offline' &&
                    this.allDocDeleted === false &&
                    joiner.partStatus !== PartStatus.PART_STARTED.value)
                {
                    this.cancelGameCreation();
                }
            }
        };
        const callback: FirebaseCollectionObserver<IUser> =
            new FirebaseCollectionObserver(destroyDocIfCreatorOffline,
                                           destroyDocIfCreatorOffline,
                                           destroyDocIfCreatorOffline);

        this.creatorSubscription = this.userService.observeUserByUsername(joiner.creator, callback);
    }
    private observeCandidates(joiner: IJoiner): void {
        display(PartCreationComponent.VERBOSE, { PartCreation_observeCandidates: joiner });
        const onDocumentCreated: (foundUser: IUserId[]) => void = (foundUsers: IUserId[]) => {
            for (const user of foundUsers) {
                if (user.doc.state === 'offline') {
                    this.removeUserFromLobby(Utils.getNonNullable(user.doc.username));
                    Utils.handleError('OnlineGameWrapper: ' + user.doc.username + ' is already offline!');
                }
            }
        };
        const onDocumentModified: (modifiedUsers: IUserId[]) => void = (modifiedUsers: IUserId[]) => {
            for (const user of modifiedUsers) {
                if (user.doc.state === 'offline') {
                    this.removeUserFromLobby(Utils.getNonNullable(user.doc.username));
                }
            }
        };
        const onDocumentDeleted: (deletedUsers: IUserId[]) => void = (deletedUsers: IUserId[]) => {
            // This should not happen in practice, but if it does we can safely remove the user from the lobby
            for (const user of deletedUsers) {
                this.removeUserFromLobby(Utils.getNonNullable(user.doc.username));
                Utils.handleError('OnlineGameWrapper: ' + user.doc.username + ' was deleted (' + user.id + ')');
            }
        };
        const callback: FirebaseCollectionObserver<IUser> =
            new FirebaseCollectionObserver(onDocumentCreated, onDocumentModified, onDocumentDeleted);
        for (const candidateName of joiner.candidates) {
            if (this.candidateSubscription.get(candidateName).isAbsent()) {
                const subscription: () => void = this.userService.observeUserByUsername(candidateName, callback);
                this.candidateSubscription.set(candidateName, subscription);
            }
        }
        for (const oldCandidate of this.candidateSubscription.listKeys()) {
            // Unsubscribe old candidates
            if (oldCandidate !== joiner.chosenPlayer) {
                if (joiner.candidates.includes(oldCandidate) === false) {
                    this.unsubscribeFrom(oldCandidate);
                }
            }
        }
    }
    private removeUserFromLobby(username: string): Promise<void> {
        const joiner: IJoiner = Utils.getNonNullable(this.currentJoiner);
        const index: number = joiner.candidates.indexOf(username);
        if (index === -1) {
            display(true, username + ' is not in the lobby!');
            // User already not in the lobby (could be caused by two updates to the same offline user)
            return Promise.resolve();
        }
        const beforeUser: string[] = joiner.candidates.slice(0, index);
        const afterUser: string[] = joiner.candidates.slice(index + 1);
        const candidates: string[] = beforeUser.concat(afterUser);
        if (username === joiner.chosenPlayer) {
            // The chosen player has been removed, the user will have to review the config
            this.messageDisplayer.infoMessage($localize`${username} left the game, please pick another opponent.`);
            return this.joinerService.reviewConfigRemoveChosenPlayerAndUpdateCandidates(candidates);
        } else {
            return this.joinerService.updateCandidates(candidates);
        }
    }
    private unsubscribeFrom(username: string): void {
        const subscription: () => void = this.candidateSubscription.delete(username);
        subscription();
    }
    public acceptConfig(): Promise<void> {
        display(PartCreationComponent.VERBOSE, 'PartCreationComponent.acceptConfig');
        // called by the joiner
        // triggers the redirection that will be applied for every subscribed user
        return this.gameService.acceptConfig(this.partId, Utils.getNonNullable(this.currentJoiner));
    }
    public async ngOnDestroy(): Promise<void> {
        display(PartCreationComponent.VERBOSE, 'PartCreationComponent.ngOnDestroy');

        // This will unsubscribe from all observables
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();

        for (const candidateName of this.candidateSubscription.listKeys()) {
            this.unsubscribeFrom(candidateName);
        }
        if (this.gameStarted === false) {
            if (this.currentJoiner === null) {
                display(PartCreationComponent.VERBOSE,
                        'PartCreationComponent.ngOnDestroy: there is no part here');
                return;
            } else if (this.userName === this.currentJoiner.creator) {
                display(PartCreationComponent.VERBOSE,
                        'PartCreationComponent.ngOnDestroy: you(creator) about to cancel creation.');
                await this.cancelGameCreation();
            } else if (this.allDocDeleted === false) {
                display(PartCreationComponent.VERBOSE,
                        'PartCreationComponent.ngOnDestroy: you(joiner) about to cancel game joining');
                await this.joinerService.cancelJoining(this.userName);
            }
        }
        return;
    }
}
