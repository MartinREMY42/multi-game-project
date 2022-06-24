/* eslint-disable max-lines-per-function */
import { ChatMessages, ChatService } from '../ChatService';
import { ChatDAO } from 'src/app/dao/ChatDAO';
import { ChatDAOMock } from 'src/app/dao/tests/ChatDAOMock.spec';
import { fakeAsync, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MGPValidation } from 'src/app/utils/MGPValidation';
import { Message, MessageDocument } from 'src/app/domain/Message';
import { serverTimestamp } from 'firebase/firestore';
import { ErrorLoggerService } from '../ErrorLoggerService';
import { ErrorLoggerServiceMock } from './ErrorLoggerServiceMock.spec';
import { JSONValue } from 'src/app/utils/utils';
import { FirestoreCollectionObserver } from 'src/app/dao/FirestoreCollectionObserver';
import { MinimalUser } from 'src/app/domain/MinimalUser';

describe('ChatService', () => {

    let service: ChatService;
    let chatDAO: ChatDAO;
    let destroyed: boolean = false;

    const MESSAGE: Message = {
        content: 'foo',
        sender: { name: 'sender', id: 'senderId' },
        postedTime: serverTimestamp(),
        currentTurn: 2,
    };

    beforeEach(fakeAsync(async() => {
        await TestBed.configureTestingModule({
            imports: [],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            providers: [
                { provide: ChatDAO, useClass: ChatDAOMock },
            ],
        }).compileComponents();

        chatDAO = TestBed.inject(ChatDAO);
        service = new ChatService(chatDAO);
    }));
    it('should be created', () => {
        expect(service).toBeTruthy();
    });
    describe('observable', () => {
        it('should follow updates after startObserving is called', fakeAsync(async() => {
            let resolvePromise: (messageIds: string[]) => void;
            const promise: Promise<string[]> = new Promise((resolve: (messageIds: string[]) => void) => {
                resolvePromise = resolve;
            });
            const callback: (chat: MessageDocument[]) => void = (messages: MessageDocument[]) => {
                if (messages.length > 0) {
                    resolvePromise(messages.map((doc: MessageDocument) => doc.id));
                }
            };
            expect(service.isObserving()).toBe(false);
            await service.createNewChat('id');
            // given a chat that is observed
            service.startObserving('id', new FirestoreCollectionObserver<Message>(callback, () => {}, () => {}));
            expect(service.isObserving()).toBe(true);

            // when the chat is updated
            const messageId: string = await chatDAO.addMessage('id', MESSAGE);

            // then the update has been observed by the callback
            const messageIds: string[] = await promise;
            expect(messageIds).toEqual([messageId]);
        }));
        it('should log error when observing the same chat twice', fakeAsync(async() => {
            spyOn(ErrorLoggerService, 'logError').and.callFake(ErrorLoggerServiceMock.logError);
            // Given a chat that is observed
            await service.createNewChat('id');
            const callback: FirestoreCollectionObserver<Message> =
                new FirestoreCollectionObserver<Message>(() => {}, () => {}, () => {});
            service.startObserving('id', callback);
            // When trying to observe it again
            // Then an error is thrown
            const errorMessage: string = 'Already observing same chat';
            expect(() => service.startObserving('id', callback)).toThrowError('ChatService: ' + errorMessage + ' (extra data: {"chatId":"id"})');
            // And it logged the error
            const errorData: JSONValue = { chatId: 'id' };
            expect(ErrorLoggerService.logError).toHaveBeenCalledWith('ChatService', errorMessage, errorData);
        }));
        it('should throw when observing a second chat while a first one is already being observed', fakeAsync(async() => {
            spyOn(ErrorLoggerService, 'logError').and.callFake(ErrorLoggerServiceMock.logError);
            // Given a chat that is observed
            await service.createNewChat('id');
            const callback: FirestoreCollectionObserver<Message> =
                new FirestoreCollectionObserver<Message>(() => {}, () => {}, () => {});
            service.startObserving('id', callback);
            // When trying to observe another chat
            // Then an error is thrown
            const errorMessage: string = 'Already observing another chat';
            expect(() => service.startObserving('id2', callback)).toThrowError('ChatService: ' + errorMessage + ' (extra data: {"chatId":"id2","followedChatId":"id"})');
            // And it logged the error
            const errorData: JSONValue = { chatId: 'id2', followedChatId: 'id' };
            expect(ErrorLoggerService.logError).toHaveBeenCalledWith('ChatService', errorMessage, errorData);
        }));
        it('should stop following updates after stopObserving is called', fakeAsync(async() => {
            let resolvePromise: (messages: Message[]) => void;
            const promise: Promise<Message[]> = new Promise((resolve: (messages: Message[]) => void) => {
                resolvePromise = resolve;
            });
            const callback: (messages: MessageDocument[]) => void = (messages: MessageDocument[]) => {
                if (messages.length > 0) {
                    resolvePromise(messages.map((doc: MessageDocument) => doc.data));
                }
            };
            expect(service.isObserving()).toBe(false);
            await service.createNewChat('id');

            // given a chat that was observed but for which stopObserving has been called
            service.startObserving('id', new FirestoreCollectionObserver<Message>(callback, () => {}, () => {}));
            service.stopObserving();
            expect(service.isObserving()).toBe(false);

            // when the chat is updated
            await chatDAO.addMessage('id', MESSAGE);

            // then the update is not observed by the callback
            await expectAsync(promise).toBePending();
        }));
        it('should not do anything throw when stopObserving is called but no chat is observed', fakeAsync(async() => {
            // Given that no chat is observed
            // When calling stopObserving
            service.stopObserving()
            // Then nothing should happen (i.e., no error thrown)
        }));
        it('should throw upon destruction if it is still observing a chat', fakeAsync(async() => {
            // Given a chat that we're observing
            await service.createNewChat('id');
            service.startObserving('id', new FirestoreCollectionObserver<Message>(() => {}, () => {}, () => {}));

            // When the service is destroyed
            // Then it throws
            expect(() => service.ngOnDestroy()).toThrowError('Assertion failure: ChatService should have unsubscribed before being destroyed (extra data: undefined)');
            destroyed = true;
        }));
    });
    describe('deleteChat', () => {
        it('should delete the chat through the DAO', fakeAsync(async() => {
            spyOn(chatDAO, 'delete');
            // given a chat that exists
            await service.createNewChat('id');

            // when calling deleteChat
            await service.deleteChat('id');

            // then the chat has been removed
            expect(chatDAO.delete).toHaveBeenCalledWith('id');
        }));
    });
    describe('createNewChat', () => {
        it('should create the chat through the DAO', fakeAsync(async() => {
            spyOn(chatDAO, 'set');
            // when calling createNewChat
            await service.createNewChat('id');
            // then the chat has been initialized with the DAO
            expect(chatDAO.set).toHaveBeenCalledWith('id', {});
        }));
    });
    describe('sendMessage', () => {
        it('should not send message if no chat is observed', fakeAsync(async() => {
            // given that no chat is observed
            // when sending a message
            const sender: MinimalUser = { name: 'foo', id: 'fooId' };
            const result: Promise<MGPValidation> = service.sendMessage(sender, 'foo', 2);
            // then the message is rejected
            await expectAsync(result).toBeResolvedTo(MGPValidation.failure('Cannot send message if not observing chat'));
        }));
        it('should not send message if the user is not allowed to send a message in the chat', fakeAsync(async() => {
            // given a chat that is observed
            await service.createNewChat('id');
            service.startObserving('id', new FirestoreCollectionObserver<Message>(() => {}, () => {}, () => {}));
            // when sending a message without a username
            const sender: MinimalUser = { name: '', id: 'fooId' };
            const result: Promise<MGPValidation> = service.sendMessage(sender, 'foo', 2);
            // then the message is rejected
            await expectAsync(result).toBeResolvedTo(MGPValidation.failure(ChatMessages.CANNOT_SEND_MESSAGE()));
        }));
        it('should not send message if it is empty', fakeAsync(async() => {
            // given a chat that is observed
            await service.createNewChat('id');
            service.startObserving('id', new FirestoreCollectionObserver<Message>(() => {}, () => {}, () => {}));
            // when sending an empty message
            const sender: MinimalUser = { name: 'sender', id: 'senderId' };
            const result: Promise<MGPValidation> = service.sendMessage(sender, '', 2);
            // then the message is rejected
            await expectAsync(result).toBeResolvedTo(MGPValidation.failure(ChatMessages.FORBIDDEN_MESSAGE()));
        }));
        it('should update the chat with the new message in the DAO', fakeAsync(async() => {
            spyOn(Date, 'now').and.returnValue(42);
            spyOn(chatDAO, 'addMessage');
            // given an empty chat that is observed
            await service.createNewChat('id');
            service.startObserving('id', new FirestoreCollectionObserver<Message>(() => {}, () => {}, () => {}));

            // when a message is sent on that chat
            const sender: MinimalUser = { name: 'sender', id: 'senderId' };
            await service.sendMessage(sender, 'foo', 2);

            // then the chat should be updated with the new message
            expect(chatDAO.addMessage).toHaveBeenCalledWith('id', MESSAGE);
        }));
    });
    afterEach(() => {
        service.stopObserving();
        if (destroyed === false) {
            service.ngOnDestroy();
        }
    });
});
