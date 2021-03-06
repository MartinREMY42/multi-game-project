import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FirstPlayer, IFirstPlayer, IJoiner, IJoinerId, IPartType, PartStatus, PartType } from '../../../domain/ijoiner';
import { Router } from '@angular/router';
import { GameService } from '../../../services/GameService';
import { JoinerService } from '../../../services/JoinerService';
import { ChatService } from '../../../services/ChatService';
import { assert, display, Utils } from 'src/app/utils/utils';
import { MGPMap } from 'src/app/utils/MGPMap';
import { UserService } from 'src/app/services/UserService';
import { IJoueur, IJoueurId } from 'src/app/domain/iuser';
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
    creator?: string;

    userIsObserver: boolean;

    firstPlayer?: IFirstPlayer;
    partType?: IPartType;
    maximalMoveDuration?: number;
    totalPartDuration?: number;
    candidates?: string[];
    chosenOpponent?: string;
}

interface ComparableSubscription {
    subscription: () => void,
    equals: () => boolean,
}
@Component({
    selector: 'app-part-creation',
    templateUrl: './part-creation.component.html',
    styleUrls: ['../../../../../node_modules/bulma-slider/dist/css/bulma-slider.min.css'],
})
export class PartCreationComponent implements OnInit, OnDestroy {
    // Lifecycle:
    // 1. Creator chooses config and opponent
    // 2. Creator click on "proposing the config"
    // 3a. Chosen opponent accepts the config -> part starts
    // 3b. Creator clicks on "modifying config" -> back to 1, with the current config and opponent

    // PageCreationComponent is always a child of OnlineGame component (one to one)
    // they need common data so that the parent calculates/retrieves the data then share it
    // with the part creation component
    public static VERBOSE: boolean = false;

    // public BLITZ_PART_DURATION: number = PartType.BLITZ_PART_DURATION;
    // public BLITZ_MOVE_DURATION: number = PartType.BLITZ_MOVE_DURATION;
    // public NORMAL_PART_DURATION: number = PartType.NORMAL_PART_DURATION;
    // public NORMAL_MOVE_DURATION: number = PartType.NORMAL_MOVE_DURATION;
    public partType: typeof PartType = PartType;

    @Input() partId: NonNullable<string>;
    @Input() userName: NonNullable<string>;

    @Output('gameStartNotification') gameStartNotification: EventEmitter<IJoiner> = new EventEmitter<IJoiner>();
    public gameStarted: boolean = false;
    // notify that the game has started, a thing evaluated with the joiner doc game status

    public viewInfo: PartCreationViewInfo = {
        userIsCreator: false,
        userIsChosenOpponent: false,
        userIsObserver: false,
    }

    public currentJoiner: IJoiner = null;

    // Subscription
    private candidateSubscription: MGPMap<string, ComparableSubscription> = new MGPMap();
    private creatorSubscription: () => void = null;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    public configFormGroup: FormGroup;

    public constructor(public router: Router,
                       public gameService: GameService,
                       public joinerService: JoinerService,
                       public chatService: ChatService,
                       public userService: UserService,
                       public formBuilder: FormBuilder,
                       public messageDisplayer: MessageDisplayer) {
        display(PartCreationComponent.VERBOSE, 'PartCreationComponent constructed for ' + this.userName);
    }
    public async ngOnInit(): Promise<void> {
        display(PartCreationComponent.VERBOSE, 'PartCreationComponent.ngOnInit for ' + this.userName);

        this.checkInputs();
        this.createForms();
        const gameExists: boolean = await this.joinerService.joinGame(this.partId, this.userName);
        if (gameExists === false) {
            // We will be redirected by the GameWrapper
            return Promise.resolve();
        }
        this.joinerService.observe(this.partId).pipe(takeUntil(this.ngUnsubscribe)).subscribe((joinerId: IJoinerId) => {
            this.onCurrentJoinerUpdate(joinerId);
            if (this.isGameCancelled(joinerId) === false) {
                const joiner: IJoiner = joinerId.doc;
                this.viewInfo.creator = joiner.creator;
                this.viewInfo.canReviewConfig = joiner.partStatus === PartStatus.CONFIG_PROPOSED.value;
                this.viewInfo.canEditConfig = joiner.partStatus !== PartStatus.CONFIG_PROPOSED.value;
                this.viewInfo.canProposeConfig = joiner.partStatus !== PartStatus.CONFIG_PROPOSED.value && this.viewInfo.chosenOpponent !== '';
                this.viewInfo.userIsCreator = this.userName === joiner.creator;
                this.viewInfo.userIsChosenOpponent = this.userName === joiner.chosenPlayer;
                this.viewInfo.userIsObserver =
                    this.viewInfo.userIsChosenOpponent === false && this.viewInfo.userIsCreator === false;
                this.viewInfo.creatorIsModifyingConfig = joiner.partStatus !== PartStatus.CONFIG_PROPOSED.value;

                this.viewInfo.partType = joiner.partType;
                this.viewInfo.showCustomTime = joiner.partType === 'CUSTOM';
                this.viewInfo.maximalMoveDuration = joiner.maximalMoveDuration;
                this.viewInfo.totalPartDuration = joiner.totalPartDuration;
                this.viewInfo.candidates = joiner.candidates;
                this.viewInfo.firstPlayer = joiner.firstPlayer;
                this.viewInfo.chosenOpponent = joiner.chosenPlayer;
            }
        });
        this.configFormGroup.get('chosenOpponent').valueChanges.pipe(takeUntil(this.ngUnsubscribe)).subscribe((opponent: string) => {
            this.viewInfo.chosenOpponent = opponent;
        });
        this.configFormGroup.get('partType').valueChanges.pipe(takeUntil(this.ngUnsubscribe)).subscribe((partType: IPartType) => {
            this.viewInfo.partType = partType;
            this.viewInfo.showCustomTime = partType === 'CUSTOM';
        });
        this.configFormGroup.get('maximalMoveDuration').valueChanges.pipe(takeUntil(this.ngUnsubscribe)).subscribe((maximalMoveDuration: number) => {
            this.viewInfo.maximalMoveDuration = maximalMoveDuration;
        });
        this.configFormGroup.get('totalPartDuration').valueChanges.pipe(takeUntil(this.ngUnsubscribe)).subscribe((totalPartDuration: number) => {
            this.viewInfo.totalPartDuration = totalPartDuration;
        });
        display(PartCreationComponent.VERBOSE, 'PartCreationComponent.ngOnInit asynchronouseries finisheds');
        return Promise.resolve();
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
    public selectFirstPlayer(firstPlayer: IFirstPlayer): Promise<void> {
        this.configFormGroup.get('firstPlayer').setValue(firstPlayer);
        return this.joinerService.setFirstPlayer(firstPlayer);
    }
    public selectPartType(partType: IPartType): Promise<void> {
        this.configFormGroup.get('partType').setValue(partType);
        switch (partType) {
            case 'STANDARD':
                this.configFormGroup.get('maximalMoveDuration').setValue(PartType.NORMAL_MOVE_DURATION);
                this.configFormGroup.get('totalPartDuration').setValue(PartType.NORMAL_PART_DURATION);
                return this.joinerService.setPartType(partType,
                                                      PartType.NORMAL_MOVE_DURATION,
                                                      PartType.NORMAL_PART_DURATION);
            case 'BLITZ':
                this.configFormGroup.get('maximalMoveDuration').setValue(PartType.BLITZ_MOVE_DURATION);
                this.configFormGroup.get('totalPartDuration').setValue(PartType.BLITZ_PART_DURATION);
                return this.joinerService.setPartType(partType,
                                                      PartType.BLITZ_MOVE_DURATION,
                                                      PartType.BLITZ_PART_DURATION);
            case 'CUSTOM':
                this.configFormGroup.get('partType').setValue('CUSTOM');
                return this.joinerService.setPartType(partType,
                                                      this.configFormGroup.get('maximalMoveDuration').value,
                                                      this.configFormGroup.get('totalPartDuration').value);
        }
    }
    public selectOpponent(player: string): void {
        display(PartCreationComponent.VERBOSE, 'PartCreationComponent.setChosenPlayer(' + player + ')');
        this.joinerService.setChosenPlayer(player);
    }
    public async reviewConfig(): Promise<void> {
        return this.joinerService.reviewConfig();
    }
    public async proposeConfig(): Promise<void> {
        const chosenPlayer: string = this.configFormGroup.get('chosenOpponent').value;
        const partType: string = this.configFormGroup.get('partType').value;
        const maxMoveDur: number = this.configFormGroup.get('maximalMoveDuration').value;
        const firstPlayer: string = this.configFormGroup.get('firstPlayer').value;
        const totalPartDuration: number = this.configFormGroup.get('totalPartDuration').value;
        return this.joinerService.proposeConfig(chosenPlayer,
                                                PartType.of(partType),
                                                maxMoveDur,
                                                FirstPlayer.of(firstPlayer),
                                                totalPartDuration);
    }
    private async cancelGameCreation(): Promise<void> {
        display(PartCreationComponent.VERBOSE, 'PartCreationComponent.cancelGameCreation');

        await this.gameService.deletePart(this.partId);
        display(PartCreationComponent.VERBOSE, 'PartCreationComponent.cancelGameCreation: game deleted');

        await this.joinerService.deleteJoiner();
        display(PartCreationComponent.VERBOSE, 'PartCreationComponent.cancelGameCreation: game and joiner deleted');

        await this.chatService.deleteChat(this.partId);
        display(PartCreationComponent.VERBOSE,
                'PartCreationComponent.cancelGameCreation: game and joiner and chat deleted');

        return Promise.resolve();
    }
    private onCurrentJoinerUpdate(iJoinerId: IJoinerId) {
        display(PartCreationComponent.VERBOSE,
                { PartCreationComponent_onCurrentJoinerUpdate: {
                    before: JSON.stringify(this.currentJoiner),
                    then: JSON.stringify(iJoinerId) } });
        if (this.isGameCancelled(iJoinerId)) {
            display(PartCreationComponent.VERBOSE,
                    'PartCreationComponent.onCurrentJoinerUpdate: LAST UPDATE : the game is cancelled');
            return this.onGameCancelled();
        } else {
            this.updateJoiner(iJoinerId.doc);
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
        this.messageDisplayer.infoMessage('La partie a été annulée');
        this.router.navigate(['server']);
    }
    private isGameStarted(joiner: IJoiner): boolean {
        return joiner && (joiner.partStatus === PartStatus.PART_STARTED.value);
    }
    private onGameStarted(joiner: IJoiner) {
        display(PartCreationComponent.VERBOSE, { partCreationComponent_onGameStarted: { joiner } });

        this.gameStartNotification.emit(joiner);
        this.gameStarted = true;
        display(PartCreationComponent.VERBOSE, 'PartCreationComponent.onGameStarted finished');
    }
    private updateJoiner(joiner: IJoiner): void {
        display(PartCreationComponent.VERBOSE, { PartCreationComponent_updateJoiner: { joiner } });

        if (this.userName === joiner.creator) {
            this.observeCandidates(joiner);
        } else {
            this.observeCreator(joiner);
        }
        this.currentJoiner = joiner;

        // Needed for when the creator leaves and joins back: he needs the current config
        this.updateFormWithJoiner(joiner);
    }
    private updateFormWithJoiner(joiner: IJoiner): void {
        this.configFormGroup.get('firstPlayer').setValue(joiner.firstPlayer);
        this.configFormGroup.get('maximalMoveDuration').setValue(joiner.maximalMoveDuration);
        this.configFormGroup.get('totalPartDuration').setValue(joiner.totalPartDuration);
        this.configFormGroup.get('partType').setValue(joiner.partType);
        this.configFormGroup.get('chosenOpponent').setValue(joiner.chosenPlayer);
    }
    private observeCreator(joiner: IJoiner): void {
        if (this.creatorSubscription != null) {
            // We are already observing the creator
            return;
        }
        const onDocumentCreated: (foundUser: IJoueurId[]) => void = (foundUsers: IJoueurId[]) => {
            for (const user of foundUsers) {
                if (user.doc.pseudo === joiner.creator && user.doc.state === 'offline') {
                    // creator is offline, remove this part
                    this.cancelGameCreation();
                }
            }
        };
        const onDocumentModified: (modifiedUsers: IJoueurId[]) => void = (modifiedUsers: IJoueurId[]) => {
            for (const user of modifiedUsers) {
                if (user.doc.pseudo === joiner.creator && user.doc.state === 'offline') {
                    this.cancelGameCreation();
                }
            }
        };
        const onDocumentDeleted: (deletedUsers: IJoueurId[]) => void = (deletedUsers: IJoueurId[]) => {
            // This should not happen in practice, but if it does we can safely remove the joiner
            for (const user of deletedUsers) {
                Utils.handleError('OnlineGameWrapper: Creator was deleted' + user.doc.pseudo);
                if (user.doc.pseudo === joiner.creator) {
                    this.cancelGameCreation();
                }
            }
        };
        const callback: FirebaseCollectionObserver<IJoueur> =
            new FirebaseCollectionObserver(onDocumentCreated,
                                           onDocumentModified,
                                           onDocumentDeleted);

        this.creatorSubscription = this.userService.observeUserByPseudo(joiner.creator, callback);
    }
    private observeCandidates(joiner: IJoiner): void {
        display(PartCreationComponent.VERBOSE, { PartCreation_observeCandidates: joiner });
        const onDocumentCreated: (foundUser: IJoueurId[]) => void = (foundUsers: IJoueurId[]) => {
            for (const user of foundUsers) {
                if (user.doc.state === 'offline') {
                    this.removeUserFromLobby(user.doc.pseudo);
                    Utils.handleError('OnlineGameWrapper: ' + user.doc.pseudo + ' is already offline!');
                }
            }
        };
        const onDocumentModified: (modifiedUsers: IJoueurId[]) => void = (modifiedUsers: IJoueurId[]) => {
            for (const user of modifiedUsers) {
                if (user.doc.state === 'offline') {
                    this.removeUserFromLobby(user.doc.pseudo);
                }
            }
        };
        const onDocumentDeleted: (deletedUsers: IJoueurId[]) => void = (deletedUsers: IJoueurId[]) => {
            // This should not happen in practice, but if it does we can safely remove the user from the lobby
            for (const user of deletedUsers) {
                Utils.handleError('OnlineGameWrapper: ' + user.doc.pseudo + ' was deleted');
                this.removeUserFromLobby(user.doc.pseudo);
            }
        };
        const callback: FirebaseCollectionObserver<IJoueur> =
            new FirebaseCollectionObserver(onDocumentCreated,
                                           onDocumentModified,
                                           onDocumentDeleted);
        for (const candidateName of joiner.candidates) {
            if (this.candidateSubscription.get(candidateName).isAbsent()) {
                // Subscribe to every new candidate
                const comparableSubscription: ComparableSubscription = {
                    subscription: this.userService.observeUserByPseudo(candidateName, callback),
                    equals: () => {
                        throw new Error('ObservableSubscription should not be used');
                    },
                };
                this.candidateSubscription.set(candidateName, comparableSubscription);
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
    private removeUserFromLobby(userPseudo: string): Promise<void> {
        const index: number = this.currentJoiner.candidates.indexOf(userPseudo);
        if (index === -1) {
            display(true, userPseudo + ' is not in the lobby!');
            // User already not in the lobby (could be caused by two updates to the same offline user)
            return;
        }
        const beforeUser: string[] = this.currentJoiner.candidates.slice(0, index);
        const afterUser: string[] = this.currentJoiner.candidates.slice(index + 1);
        const candidates: string[] = beforeUser.concat(afterUser);
        if (userPseudo === this.currentJoiner.chosenPlayer) {
            // The chosen player has been removed, the user will have to review the config
            this.messageDisplayer.infoMessage($localize`${userPseudo} a quitté la partie, veuillez choisir un autre adversaire`);
            return this.joinerService.reviewConfigRemoveChosenPlayerAndUpdateCandidates(candidates);
        } else {
            this.joinerService.updateCandidates(candidates);
        }
    }
    private unsubscribeFrom(userPseudo: string): void {
        const subscription: ComparableSubscription = this.candidateSubscription.delete(userPseudo);
        subscription.subscription();
    }
    public acceptConfig(): Promise<void> {
        display(PartCreationComponent.VERBOSE, 'PartCreationComponent.acceptConfig');
        // called by the joiner
        // triggers the redirection that will be applied for every subscribed user
        return this.gameService.acceptConfig(this.partId, this.currentJoiner);
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
            } else {
                display(PartCreationComponent.VERBOSE,
                        'PartCreationComponent.ngOnDestroy: you(joiner) about to cancel game joining');
                await this.joinerService.cancelJoining(this.userName);
            }
        }
        return Promise.resolve();
    }
}
