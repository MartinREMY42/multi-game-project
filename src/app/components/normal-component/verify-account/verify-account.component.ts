import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthenticationService, AuthUser } from 'src/app/services/AuthenticationService';
import { MGPValidation } from 'src/app/utils/MGPValidation';

/**
 * Component to verify an account.
 * The meaning of verifying an account depends on the type of account:
 *   - for an email account, it means resending the verification email
 *   - for a google account, it means entering a username
 */
@Component({
    selector: 'app-verify-account',
    templateUrl: './verify-account.component.html',
})
export class VerifyAccountComponent implements OnInit, OnDestroy {
    public verificationType: 'send-email' | 'enter-username' = null;

    public success: boolean = false;

    public errorMessage: string;

    public emailAddress: string;

    public userSub: Subscription;

    public usernameForm: FormGroup = new FormGroup({
        username: new FormControl(),
    });

    constructor(public authService: AuthenticationService,
                public router: Router) {}

    public async ngOnInit(): Promise<void> {
        this.userSub = this.authService.getUserObs()
            .subscribe((user: AuthUser) => {
                this.emailAddress = user.email;
                // We know that if this page is shown, something needs to be done to finalize the account
                if (user.username == null || user.username === '') {
                    // If the user has no username, it will need to be defined
                    this.verificationType = 'enter-username';
                } else {
                    // Otherwise, it means the user needs to verify its email
                    this.verificationType = 'send-email';
                }
            });
    }
    public async pickUsername(formContent: { username: string }): Promise<void> {
        const result: MGPValidation = await this.authService.setUsername(formContent.username);
        if (result.isSuccess()) {
            this.success = true;
        } else {
            this.errorMessage = result.getReason();
        }
    }
    public async sendEmailVerification(): Promise<void> {
        const result: MGPValidation = await this.authService.sendEmailVerification();
        if (result.isSuccess()) {
            this.success = true;
        } else {
            this.errorMessage = result.getReason();
        }
    }
    public ngOnDestroy(): void {
        if (this.userSub && this.userSub.unsubscribe) {
            this.userSub.unsubscribe();
        }
    }
}
