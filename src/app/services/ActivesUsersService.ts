import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { IJoueurId, IJoueur } from '../domain/iuser';
import { JoueursDAO } from '../dao/JoueursDAO';
import { FirebaseCollectionObserver } from '../dao/FirebaseCollectionObserver';
import { display } from 'src/app/utils/utils';

@Injectable({
    providedIn: 'root',
})
export class ActivesUsersService {
    public static VERBOSE: boolean = false;

    private activesUsersBS: BehaviorSubject<IJoueurId[]> = new BehaviorSubject<IJoueurId[]>([]);

    public activesUsersObs: Observable<IJoueurId[]> = this.activesUsersBS.asObservable();

    private unsubscribe: () => void;

    constructor(public joueursDAO: JoueursDAO) {
    }
    public startObserving(): void {
        display(ActivesUsersService.VERBOSE, 'ActivesUsersService.startObservingActivesUsers');
        const onDocumentCreated: (newUsers: IJoueurId[]) => void = (newUsers: IJoueurId[]) => {
            display(ActivesUsersService.VERBOSE, 'our DAO gave us ' + newUsers.length + ' new user(s)');
            const newUsersList: IJoueurId[] = this.activesUsersBS.value.concat(...newUsers);
            this.activesUsersBS.next(this.order(newUsersList));
        };
        const onDocumentModified: (modifiedUsers: IJoueurId[]) => void = (modifiedUsers: IJoueurId[]) => {
            let updatedUsers: IJoueurId[] = this.activesUsersBS.value;
            display(ActivesUsersService.VERBOSE, 'our DAO updated ' + modifiedUsers.length + ' user(s)');
            for (const u of modifiedUsers) {
                updatedUsers.forEach((user: IJoueurId) => {
                    if (user.id === u.id) user.doc = u.doc;
                });
                updatedUsers = this.order(updatedUsers);
            }
            this.activesUsersBS.next(updatedUsers);
        };
        const onDocumentDeleted: (deletedUsers: IJoueurId[]) => void = (deletedUsers: IJoueurId[]) => {
            const deletedUsersId: string[] = deletedUsers.map((u: IJoueurId) => u.id);
            const newUsersList: IJoueurId[] =
                this.activesUsersBS.value.filter((u: IJoueurId) => !deletedUsersId.includes(u.id));
            this.activesUsersBS.next(this.order(newUsersList));
        };
        const joueursObserver: FirebaseCollectionObserver<IJoueur> =
            new FirebaseCollectionObserver(onDocumentCreated,
                                           onDocumentModified,
                                           onDocumentDeleted);
        this.unsubscribe = this.joueursDAO.observeActivesUsers(joueursObserver);
    }
    public stopObserving(): void {
        this.unsubscribe();
        this.activesUsersBS.next([]);
    }
    public order(users: IJoueurId[]): IJoueurId[] {
        return users.sort((first: IJoueurId, second: IJoueurId) => {
            const firstTimestamp: number = (first.doc.last_changed as {seconds: number}).seconds;
            const secondTimestamp: number = (second.doc.last_changed as {seconds: number}).seconds;
            return firstTimestamp - secondTimestamp;
        });
    }
}
