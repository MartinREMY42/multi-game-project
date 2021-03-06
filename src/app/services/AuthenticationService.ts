import { AngularFireAuth } from '@angular/fire/auth';
import { Injectable, OnDestroy } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/database';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';

import { display } from 'src/app/utils/utils';
import { IJoueur } from '../domain/iuser';

interface ConnectivityStatus {
    state: string,
    // eslint-disable-next-line camelcase
    last_changed: unknown,
}
export interface AuthUser {
    pseudo: string,
    verified: boolean,
}
@Injectable()
export class AuthenticationService implements OnDestroy {
    public static VERBOSE: boolean = false;

    public static NOT_AUTHENTICATED: { pseudo: string, verified: boolean } = null;

    public static NOT_CONNECTED: { pseudo: string, verified: boolean } = { pseudo: null, verified: null };

    private authSub: Subscription;

    private joueurBS: BehaviorSubject<AuthUser>;

    private joueurObs: Observable<AuthUser>;

    constructor(public afAuth: AngularFireAuth, private afs: AngularFirestore) {
        display(AuthenticationService.VERBOSE, '1 authService subscribe to Obs<User>');

        this.joueurBS = new BehaviorSubject<AuthUser>(AuthenticationService.NOT_AUTHENTICATED);
        this.joueurObs = this.joueurBS.asObservable();
        this.authSub = this.afAuth.authState.subscribe((user: firebase.User) => {
            if (user == null) { // user logged out
                display(AuthenticationService.VERBOSE, '2.B: User is not connected, according to fireAuth');
                this.joueurBS.next(AuthenticationService.NOT_CONNECTED);
            } else { // user logged in
                this.updatePresence();
                const pseudo: string =
                    (user.displayName === '' || user.displayName == null) ? user.email : user.displayName;
                display(AuthenticationService.VERBOSE, { userLoggedInAccordingToFireAuth: user });
                const verified: boolean = user.emailVerified;
                this.joueurBS.next({ pseudo, verified });
            }
        });
    }
    public async doEmailLogin(email: string, password: string): Promise<firebase.auth.UserCredential> {
        display(AuthenticationService.VERBOSE, 'AuthenticationService.doEmailLogin(' + email + ')');
        const userCredential: firebase.auth.UserCredential =
            await firebase.auth().signInWithEmailAndPassword(email, password);
        await this.updateUserDataAndGoToServer(userCredential.user);
        return userCredential;
    }
    private updateUserDataAndGoToServer({ uid, email, displayName, emailVerified }: firebase.User): Promise<void> {
        display(AuthenticationService.VERBOSE, 'AuthenticationService.updateUserDataAndGoToServer(' + email + ')');
        // Sets user data to firestore on login
        const userRef: AngularFirestoreDocument<Partial<IJoueur>> = this.afs.doc(`joueurs/${uid}`);

        const data: Partial<IJoueur> = {
            email,
            displayName,
            pseudo: displayName || email,
            emailVerified,
        };

        return userRef.set(data, { merge: true });
    }
    public async doGoogleLogin(): Promise<firebase.auth.UserCredential> {
        const provider: firebase.auth.GoogleAuthProvider =
            new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        const userCredential: firebase.auth.UserCredential =
            await this.afAuth.signInWithPopup(provider);
        await this.updateUserDataAndGoToServer(userCredential.user);
        return userCredential;
    }
    public async doRegister(value: {email: string, password: string}): Promise<firebase.auth.UserCredential> {
        display(AuthenticationService.VERBOSE, 'AuthenticationService.doRegister(' + value.email + ')');
        const userCredential: firebase.auth.UserCredential =
            await firebase.auth().createUserWithEmailAndPassword(value.email, value.password);
        await this.updateUserDataAndGoToServer(userCredential.user);
        return userCredential;
    }
    public async disconnect(): Promise<void> {
        const uid: string = firebase.auth().currentUser.uid;
        const isOfflineForDatabase: ConnectivityStatus = {
            state: 'offline',
            last_changed: firebase.database.ServerValue.TIMESTAMP,
        };
        await firebase.database().ref('/status/' + uid).set(isOfflineForDatabase);
        return this.afAuth.signOut();
    }
    public getAuthenticatedUser(): AuthUser {
        return this.joueurBS.getValue();
    }
    public updatePresence(): void {
        const uid: string = firebase.auth().currentUser.uid;
        const userStatusDatabaseRef: firebase.database.Reference = firebase.database().ref('/status/' + uid);
        firebase.database().ref('.info/connected').on('value', function(snapshot: firebase.database.DataSnapshot) {
            if (snapshot.val() === false) {
                return;
            }
            const isOfflineForDatabase: ConnectivityStatus = {
                state: 'offline',
                last_changed: firebase.database.ServerValue.TIMESTAMP,
            };
            const isOnlineForDatabase: ConnectivityStatus = {
                state: 'online',
                last_changed: firebase.database.ServerValue.TIMESTAMP,
            };
            userStatusDatabaseRef.onDisconnect().set(isOfflineForDatabase).then(function() {
                userStatusDatabaseRef.set(isOnlineForDatabase);
            });
        });
    }
    public ngOnDestroy(): void {
        if (this.authSub) this.authSub.unsubscribe();
    }
    public getJoueurObs(): Observable<AuthUser> {
        return this.joueurObs;
    }
    public sendEmailVerification(): Promise<void> {
        display(AuthenticationService.VERBOSE, 'AuthenticationService.sendEmailVerification()');
        const user: firebase.User = firebase.auth().currentUser;
        if (!user) {
            throw new Error('Unlogged users can\'t send email verification');
        }
        if (user.emailVerified === true) {
            throw new Error('Verified users shouldn\'t ask twice email verification');
        } else {
            return user.sendEmailVerification();
        }
    }
}
