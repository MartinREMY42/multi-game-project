import { fakeAsync, TestBed } from '@angular/core/testing';
import { ChatComponent } from './chat.component';
import { AuthUser } from 'src/app/services/AuthenticationService';
import { ChatService } from 'src/app/services/ChatService';
import { ChatDAO } from 'src/app/dao/ChatDAO';
import { DebugElement } from '@angular/core';
import { IChat } from 'src/app/domain/ichat';
import { AuthenticationServiceMock } from 'src/app/services/tests/AuthenticationService.spec';
import { SimpleComponentTestUtils } from 'src/app/utils/tests/TestUtils.spec';
import { IMessage } from 'src/app/domain/imessage';

describe('ChatComponent', () => {

    let testUtils: SimpleComponentTestUtils<ChatComponent>;

    let component: ChatComponent;

    let chatService: ChatService;

    let chatDAO: ChatDAO;

    const MSG: IMessage = { sender: 'foo', content: 'hello', currentTurn: 0, postedTime: 5 };
    function generateMessages(n: number): IMessage[] {
        const messages: IMessage[] = [];
        for (let i: number = 0; i < n; i++) {
            messages.push(MSG);
        }
        return messages;
    }
    // needed to have a scrollable chat
    const LOTS_OF_MESSAGES: IMessage[] = generateMessages(100);

    beforeEach(fakeAsync(async() => {
        testUtils = await SimpleComponentTestUtils.create(ChatComponent);
        component = testUtils.getComponent();
        component.chatId = 'fauxChat';
        component.turn = 2;
        chatService = TestBed.inject(ChatService);
        chatDAO = TestBed.inject(ChatDAO);
        await chatDAO.set('fauxChat', { messages: [] });
        spyOn(chatService, 'stopObserving');
    }));
    it('should create', fakeAsync(async() => {
        // wait for the chat to be initialized (without it, ngOnInit will not be called)
        testUtils.detectChanges();
        expect(component).toBeTruthy();
    }));
    describe('disconnected chat', () => {
        it('should not observe (load messages) and show disconnected chat for unlogged user', fakeAsync(async() => {
            spyOn(chatService, 'startObserving');
            spyOn(component, 'loadChatContent');
            // given a user that is not connected
            AuthenticationServiceMock.setUser(AuthUser.NOT_CONNECTED);

            // when the component is initialized
            component.ngOnInit();
            testUtils.detectChanges();
            spyOn(component['authSubscription'], 'unsubscribe');

            // It should not observe, not load the chat content, and show the disconnected chat
            expect(chatService.startObserving).not.toHaveBeenCalled();
            expect(component.loadChatContent).not.toHaveBeenCalled();
            testUtils.expectElementToExist('#disconnected-chat');

            component.ngOnDestroy();
            await testUtils.whenStable();
            // chatService.stopObserving should not have been called neither
            expect(chatService.stopObserving).not.toHaveBeenCalled();
            // but the auth subscription needs to be cancelled!
            expect(component['authSubscription'].unsubscribe).toHaveBeenCalled();
        }));
    });
    describe('connected chat', () => {
        it('should propose to hide chat when chat is visible, and work', fakeAsync(async() => {
            // Given a user that is connected
            AuthenticationServiceMock.setUser(AuthenticationServiceMock.CONNECTED);
            testUtils.detectChanges();
            let switchButton: DebugElement = testUtils.findElement('#switchChatVisibilityButton');
            const chat: DebugElement = testUtils.findElement('#chatForm');
            expect(switchButton.nativeElement.innerText).toEqual('Hide chat');
            expect(chat).withContext('Chat should be visible on init').toBeTruthy();

            // when switching the chat visibility
            testUtils.clickElement('#switchChatVisibilityButton');
            testUtils.detectChanges();

            switchButton = testUtils.findElement('#switchChatVisibilityButton');
            // Then the chat is not visible and the button changes its text
            expect(switchButton.nativeElement.innerText).toEqual('Show chat (no new message)');
            testUtils.expectElementNotToExist('#chatDiv');
            testUtils.expectElementNotToExist('#chatForm');
        }));
        it('should propose to show chat when chat is hidden, and work', fakeAsync(async() => {
            AuthenticationServiceMock.setUser(AuthenticationServiceMock.CONNECTED);
            testUtils.detectChanges();
            testUtils.clickElement('#switchChatVisibilityButton');
            testUtils.detectChanges();

            // Given that the chat is hidden
            let switchButton: DebugElement = testUtils.findElement('#switchChatVisibilityButton');
            let chat: DebugElement = testUtils.findElement('#chatForm');
            expect(switchButton.nativeElement.innerText).toEqual('Show chat (no new message)');
            expect(chat).withContext('Chat should be hidden').toBeFalsy();

            // when showing the chat
            testUtils.clickElement('#switchChatVisibilityButton');
            testUtils.detectChanges();

            // then the chat is shown
            switchButton = testUtils.findElement('#switchChatVisibilityButton');
            chat = testUtils.findElement('#chatForm');
            expect(switchButton.nativeElement.innerText).toEqual('Hide chat');
            expect(chat).withContext('Chat should be visible after calling show').toBeTruthy();
        }));
        it('should show how many messages where sent since you hide the chat', fakeAsync(async() => {
            // Given a hidden chat with no message
            AuthenticationServiceMock.setUser(AuthenticationServiceMock.CONNECTED);
            testUtils.detectChanges();
            testUtils.clickElement('#switchChatVisibilityButton');
            testUtils.detectChanges();
            let switchButton: DebugElement = testUtils.findElement('#switchChatVisibilityButton');
            expect(switchButton.nativeElement.innerText).toEqual('Show chat (no new message)');

            // when a new message is received
            await chatDAO.update('fauxChat', { messages: [MSG, MSG, MSG] });
            testUtils.detectChanges();

            // then the button shows how many new messages there are
            switchButton = testUtils.findElement('#switchChatVisibilityButton');
            expect(switchButton.nativeElement.innerText).toEqual('Show chat (3 new messages)');
        }));
        it('should scroll to the bottom on load', fakeAsync(async() => {
            // Given a visible chat with multiple messages
            AuthenticationServiceMock.setUser(AuthenticationServiceMock.CONNECTED);
            spyOn(component, 'scrollTo');
            await chatDAO.update('fauxChat', { messages: LOTS_OF_MESSAGES });

            // when the chat is initialized
            testUtils.detectChanges();

            const chatDiv: DebugElement = testUtils.findElement('#chatDiv');
            expect(component.scrollTo).toHaveBeenCalledWith(chatDiv.nativeElement.scrollHeight);
        }));
        it('should not scroll down upon new messages if the user scrolled up, but show an indicator', fakeAsync(async() => {
            const SCROLL: number = 200;
            // Given a visible chat with multiple messages, that has been scrolled up
            AuthenticationServiceMock.setUser(AuthenticationServiceMock.CONNECTED);
            testUtils.detectChanges();
            await chatDAO.update('fauxChat', { messages: LOTS_OF_MESSAGES });
            testUtils.detectChanges();

            const chatDiv: DebugElement = testUtils.findElement('#chatDiv');
            chatDiv.nativeElement.scroll({ top: SCROLL, left: 0, behavior: 'auto' }); // user scrolled up in the chat
            chatDiv.nativeElement.dispatchEvent(new Event('scroll'));
            testUtils.detectChanges();

            // when a new message is received
            await chatDAO.update('fauxChat', { messages: LOTS_OF_MESSAGES.concat(MSG) });
            testUtils.detectChanges();

            // then the scroll value did not change
            expect(chatDiv.nativeElement.scrollTop).toBe(SCROLL);
            // and the indicator shows t hat there is a new message
            const indicator: DebugElement = testUtils.findElement('#scrollToBottomIndicator');
            expect(indicator.nativeElement.innerHTML).toEqual('1 new message ↓');
        }));
        it('should scroll to bottom when clicking on the new message indicator', fakeAsync(async() => {
            // Given a visible chat with the indicator
            AuthenticationServiceMock.setUser(AuthenticationServiceMock.CONNECTED);
            testUtils.detectChanges();
            await chatDAO.update('fauxChat', { messages: LOTS_OF_MESSAGES });
            testUtils.detectChanges();

            const chatDiv: DebugElement = testUtils.findElement('#chatDiv');
            chatDiv.nativeElement.scroll({ top: 0, left: 0, behavior: 'auto' }); // user scrolled up in the chat
            chatDiv.nativeElement.dispatchEvent(new Event('scroll'));
            testUtils.detectChanges();

            await chatDAO.update('fauxChat', { messages: LOTS_OF_MESSAGES.concat(MSG) }); // new message has been received
            testUtils.detectChanges();

            // when the indicator is clicked
            spyOn(component, 'scrollToBottom').and.callThrough();
            testUtils.clickElement('#scrollToBottomIndicator');
            testUtils.detectChanges();
            await testUtils.whenStable();

            // then the view is scrolled to the bottom
            expect(component.scrollToBottom).toHaveBeenCalled();
            // and the indicator has disappeared
            testUtils.expectElementNotToExist('#scrollToBottomIndicator');
        }));
        it('should reset new messages count once messages have been read', fakeAsync(async() => {
            // Given a hidden chat with one unseen message
            AuthenticationServiceMock.setUser(AuthenticationServiceMock.CONNECTED);
            testUtils.detectChanges();
            testUtils.clickElement('#switchChatVisibilityButton');
            testUtils.detectChanges();
            const chat: Partial<IChat> = { messages: [{ sender: 'roger', content: 'Saluuuut', currentTurn: 0, postedTime: 5 }] };
            await chatDAO.update('fauxChat', chat);
            testUtils.detectChanges();
            let switchButton: DebugElement = testUtils.findElement('#switchChatVisibilityButton');
            expect(switchButton.nativeElement.innerText).toEqual('Show chat (1 new message)');

            // When the chat is shown and then hidden again
            testUtils.clickElement('#switchChatVisibilityButton');
            testUtils.detectChanges();
            testUtils.clickElement('#switchChatVisibilityButton');
            testUtils.detectChanges();

            // Then the button text is updated
            switchButton = testUtils.findElement('#switchChatVisibilityButton');
            expect(switchButton.nativeElement.innerText).toEqual('Show chat (no new message)');
        }));
        it('should send messages using the chat service', fakeAsync(async() => {
            spyOn(chatService, 'sendMessage');
            // given a chat
            AuthenticationServiceMock.setUser(AuthenticationServiceMock.CONNECTED);
            testUtils.detectChanges();

            // when the form is filled and the send button clicked
            const messageInput: DebugElement = testUtils.findElement('#message');
            messageInput.nativeElement.value = 'hello';
            messageInput.nativeElement.dispatchEvent(new Event('input'));
            await testUtils.whenStable();

            testUtils.clickElement('#send');
            testUtils.detectChanges();
            await testUtils.whenStable();

            // then the message is sent
            const username: string = AuthenticationServiceMock.CONNECTED.username.get();
            expect(chatService.sendMessage).toHaveBeenCalledWith(username, 'hello', 2);
            //  and the form is cleared
            expect(messageInput.nativeElement.value).toBe('');
        }));
        it('should scroll to bottom when sending a message', fakeAsync(async() => {
            // given a chat with many messages
            AuthenticationServiceMock.setUser(AuthenticationServiceMock.CONNECTED);
            await chatDAO.update('fauxChat', { messages: LOTS_OF_MESSAGES.concat(MSG) }); // new message has been received
            testUtils.detectChanges();
            spyOn(component, 'scrollTo');

            // when a message is sent
            component.userMessage = 'hello there';
            testUtils.detectChanges();
            await component.sendMessage();
            testUtils.detectChanges();

            // then we scroll to the bottom
            const chatDiv: DebugElement = testUtils.findElement('#chatDiv');
            expect(component.scrollTo).toHaveBeenCalledWith(chatDiv.nativeElement.scrollHeight);
        }));
        afterEach(fakeAsync(async() => {
            component.ngOnDestroy();
            await testUtils.whenStable();
            // For the connected chat, the subscription need to be properly closed
            expect(chatService.stopObserving).toHaveBeenCalled();
        }));
    });
});
