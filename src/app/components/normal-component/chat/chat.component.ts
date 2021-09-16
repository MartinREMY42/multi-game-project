import { Component, Input, OnDestroy, ElementRef, ViewChild, OnInit, AfterViewChecked } from '@angular/core';
import { ChatService } from '../../../services/ChatService';
import { IMessage } from '../../../domain/imessage';
import { AuthenticationService, AuthUser } from 'src/app/services/AuthenticationService';
import { IChatId } from 'src/app/domain/ichat';
import { assert, display } from 'src/app/utils/utils';
import { MGPOptional } from 'src/app/utils/MGPOptional';

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
})
export class ChatComponent implements OnInit, AfterViewChecked, OnDestroy {
    public static VERBOSE: boolean = false;

    @Input() public chatId: string;
    @Input() public turn: number;
    public userMessage: string = '';
    public userName: MGPOptional<string> = MGPOptional.empty();

    public connected: boolean = false;
    public chat: IMessage[] = [];
    public readMessages: number = 0;
    public unreadMessagesText: string = '';
    public showUnreadMessagesButton: boolean = false;
    public visible: boolean = true;

    private isNearBottom: boolean = true;
    private notYetScrolled: boolean = true;

    @ViewChild('chatDiv') chatDiv: ElementRef<HTMLElement>;

    constructor(private chatService: ChatService,
                private authenticationService: AuthenticationService) {
        display(ChatComponent.VERBOSE, 'ChatComponent constructor');
    }
    public ngOnInit(): void {
        display(ChatComponent.VERBOSE, 'ChatComponent.ngOnInit');

        assert(this.chatId != null && this.chatId !== '', 'No chat to join mentionned');

        this.authenticationService.getJoueurObs()
            .subscribe((joueur: AuthUser) => {
                if (this.isConnectedUser(joueur)) {
                    display(ChatComponent.VERBOSE, JSON.stringify(joueur) + ' just connected');
                    this.userName = MGPOptional.of(joueur.pseudo);
                    this.connected = true;
                    this.loadChatContent();
                } else {
                    display(ChatComponent.VERBOSE, 'No User Logged');
                    this.userName = MGPOptional.empty();
                    this.connected = false;
                }
            });
    }
    public ngAfterViewChecked(): void {
        this.scrollToBottomIfNeeded();
    }
    public isConnectedUser(joueur: { pseudo: string; verified: boolean;}): boolean {
        return joueur && joueur.pseudo && joueur.pseudo !== '';
    }
    public loadChatContent(): void {
        display(ChatComponent.VERBOSE, 'User \'' + this.userName + '\' logged, loading chat content');

        this.chatService.startObserving(this.chatId, (id: IChatId) => {
            this.updateMessages(id);
        });
    }
    public updateMessages(iChatId: IChatId): void {
        this.chat = iChatId.doc.messages;
        const nbMessages: number = this.chat.length;
        if (this.visible === true && this.isNearBottom === true) {
            this.readMessages = nbMessages;
            this.updateUnreadMessagesText(0);
            this.scrollToBottom();
        } else {
            this.updateUnreadMessagesText(nbMessages - this.readMessages);
        }
    }
    private updateUnreadMessagesText(unreadMessages: number): void {
        if (this.visible && this.isNearBottom === false) {
            this.showUnreadMessagesButton = true;
        } else {
            this.showUnreadMessagesButton = false;
        }

        if (unreadMessages === 0) {
            this.unreadMessagesText = $localize`no new message`;
            this.showUnreadMessagesButton = false;
        } else if (unreadMessages === 1) {
            this.unreadMessagesText = $localize`1 new message`;
        } else {
            this.unreadMessagesText = $localize`${unreadMessages} new messages`;
        }
    }
    private scrollToBottomIfNeeded(): void {
        if (this.connected && this.visible) {
            if (this.isNearBottom || this.notYetScrolled) {
                this.scrollToBottom();
            }
        }
    }
    public updateCurrentScrollPosition(): void {
        const threshold: number = 10;
        const position: number = this.chatDiv.nativeElement.scrollTop + this.chatDiv.nativeElement.offsetHeight;
        const height: number = this.chatDiv.nativeElement.scrollHeight;
        this.isNearBottom = position > height - threshold;
    }
    public scrollToBottom(): void {
        if (this.chatDiv == null) {
            return;
        }
        this.updateUnreadMessagesText(0);
        this.scrollTo(this.chatDiv.nativeElement.scrollHeight);
        this.notYetScrolled = false;
    }
    public scrollTo(position: number): void {
        this.chatDiv.nativeElement.scroll({
            top: position,
            left: 0,
            behavior: 'smooth',
        });
    }
    public async sendMessage(): Promise<void> {
        assert(this.userName.isPresent(), 'disconnected user is not able to send a message');
        const content: string = this.userMessage;
        this.userMessage = ''; // clears it first to seem more responsive
        await this.chatService.sendMessage(this.userName.get(), this.turn, content);
    }
    public ngOnDestroy(): void {
        if (this.chatService.isObserving()) {
            this.chatService.stopObserving();
        }
    }
    public switchChatVisibility(): void {
        if (this.visible === true) {
            this.visible = false;
        } else {
            this.visible = true;
            this.updateUnreadMessagesText(0);
            this.scrollToBottom();
            this.readMessages = this.chat.length;
        }
    }
}
