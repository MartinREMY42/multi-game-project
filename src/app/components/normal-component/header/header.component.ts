import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService, AuthUser } from 'src/app/services/AuthenticationService';
import { Subscription } from 'rxjs';
import { LocaleUtils } from 'src/app/utils/LocaleUtils';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit, OnDestroy {
    public username: string = 'connecting...';

    private userSub: Subscription;

    public showMenu: boolean = false;

    public currentLanguage: string;
    public availableLanguages: string[] = ['FR', 'EN'];

    constructor(public router: Router,
                public authenticationService: AuthenticationService) {
    }
    public ngOnInit(): void {
        this.currentLanguage = LocaleUtils.getLocale().toUpperCase();
        this.userSub = this.authenticationService.getUserObs()
            .subscribe((user: AuthUser) => {
                if (user.username.isPresent()) {
                    this.username = user.username.get();
                } else if (user.email.isPresent()) {
                    this.username = user.email.get();
                } else {
                    this.username = '';
                }
            });
    }
    public async logout(): Promise<void> {
        await this.authenticationService.disconnect();
        await this.router.navigate(['/']);
    }
    public changeLanguage(language: string): void {
        localStorage.setItem('locale', language.toLowerCase());
        // Reload app for selected language
        window.open(window.location.href, '_self');
    }
    public ngOnDestroy(): void {
        this.userSub.unsubscribe();
    }
}
