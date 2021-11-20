import { BrowserModule } from '@angular/platform-browser';
import { LOCALE_ID, NgModule } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Route } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import localeFr from '@angular/common/locales/fr';

import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';

import { PartDAO } from './dao/PartDAO';

import { ChatService } from './services/ChatService';
import { UserService } from './services/UserService';
import { AuthenticationService } from './services/AuthenticationService';
import { GameService } from './services/GameService';
import { JoinerService } from './services/JoinerService';

import { EmailVerified } from './guard/EmailVerified';
import { MustVerifyEmail } from './guard/MustVerifyEmail';

import { AppComponent } from './app.component';
import { HeaderComponent } from './components/normal-component/header/header.component';
import { WelcomeComponent } from './components/normal-component/welcome/welcome.component';
import { LoginComponent } from './components/normal-component/login/login.component';
import { ServerPageComponent } from './components/normal-component/server-page/server-page.component';
import { PickGameComponent } from './components/normal-component/pick-game/pick-game.component';
import { PartCreationComponent } from './components/wrapper-components/part-creation/part-creation.component';
import { NotFoundComponent } from './components/normal-component/not-found/not-found.component';
import { ChatComponent } from './components/normal-component/chat/chat.component';
import { CountDownComponent } from './components/normal-component/count-down/count-down.component';
import { OnlineGameWrapperComponent }
    from './components/wrapper-components/online-game-wrapper/online-game-wrapper.component';
import { LocalGameWrapperComponent }
    from 'src/app/components/wrapper-components/local-game-wrapper/local-game-wrapper.component';
import { TutorialGameWrapperComponent }
    from './components/wrapper-components/tutorial-game-wrapper/tutorial-game-wrapper.component';
import { GameIncluderComponent } from './components/game-components/game-includer/game-includer.component';
import { InscriptionComponent } from './components/normal-component/inscription/inscription.component';
import { ConfirmInscriptionComponent }
    from './components/normal-component/confirm-inscription/confirm-inscription.component';
import { LocalGameCreationComponent }
    from './components/normal-component/local-game-creation/local-game-creation.component';
import { OnlineGameCreationComponent }
    from './components/normal-component/online-game-creation/online-game-creation.component';
import { TutorialGameCreationComponent }
    from './components/normal-component/tutorial-game-creation/tutorial-game-creation.component';
import { HumanDuration } from './utils/TimeUtils';
import { NextGameLoadingComponent } from './components/normal-component/next-game-loading/next-game-loading.component';

import { AbaloneComponent } from './games/abalone/abalone.component';
import { AwaleComponent } from './games/awale/awale.component';
import { CoerceoComponent } from './games/coerceo/coerceo.component';
import { DraughtsComponent } from './games/draughts/draughts.component';
import { DvonnComponent } from './games/dvonn/dvonn.component';
import { EncapsuleComponent } from './games/encapsule/encapsule.component';
import { EpaminondasComponent } from './games/epaminondas/epaminondas.component';
import { GipfComponent } from './games/gipf/gipf.component';
import { GoComponent } from './games/go/go.component';
import { KamisadoComponent } from './games/kamisado/kamisado.component';
import { LinesOfActionComponent } from './games/lines-of-action/lines-of-action.component';
import { MinimaxTestingComponent } from './games/minimax-testing/minimax-testing.component';
import { P4Component } from './games/p4/p4.component';
import { PentagoComponent } from './games/pentago/pentago.component';
import { PylosComponent } from './games/pylos/pylos.component';
import { QuartoComponent } from './games/quarto/quarto.component';
import { QuixoComponent } from './games/quixo/quixo.component';
import { ReversiComponent } from './games/reversi/reversi.component';
import { SaharaComponent } from './games/sahara/sahara.component';
import { SiamComponent } from './games/siam/siam.component';
import { SixComponent } from './games/six/six.component';
import { TablutComponent } from './games/tablut/tablut.component';
import { YinshComponent } from './games/yinsh/yinsh.component';

import { environment } from 'src/environments/environment';
import { USE_EMULATOR as USE_FIRESTORE_EMULATOR } from '@angular/fire/firestore';
import { LocaleUtils } from './utils/LocaleUtils';


registerLocaleData(localeFr);

const routes: Route [] = [
    { path: 'login', component: LoginComponent },
    { path: 'server', component: ServerPageComponent, canActivate: [EmailVerified] },
    { path: 'inscription', component: InscriptionComponent },
    { path: 'confirm-inscription', component: ConfirmInscriptionComponent, canActivate: [MustVerifyEmail] },
    { path: 'notFound', component: NotFoundComponent, canActivate: [EmailVerified] },
    { path: 'nextGameLoading', component: NextGameLoadingComponent, canActivate: [EmailVerified] },

    { path: 'play', component: OnlineGameCreationComponent, canActivate: [EmailVerified] },
    { path: 'play/:compo/:id', component: OnlineGameWrapperComponent, canActivate: [EmailVerified] },
    { path: 'local', component: LocalGameCreationComponent },
    { path: 'local/:compo', component: LocalGameWrapperComponent },
    { path: 'tutorial', component: TutorialGameCreationComponent },
    { path: 'tutorial/:compo', component: TutorialGameWrapperComponent },
    { path: '', component: WelcomeComponent },
    { path: '**', component: WelcomeComponent },
];

@NgModule({
    declarations: [
        AppComponent,
        HeaderComponent,
        WelcomeComponent,
        LoginComponent,
        ServerPageComponent,
        PickGameComponent,
        ChatComponent,
        PartCreationComponent,
        InscriptionComponent,
        NotFoundComponent,
        NextGameLoadingComponent,
        CountDownComponent,
        OnlineGameWrapperComponent,
        LocalGameWrapperComponent,
        TutorialGameWrapperComponent,
        GameIncluderComponent,
        ConfirmInscriptionComponent,
        LocalGameCreationComponent,
        OnlineGameCreationComponent,
        TutorialGameCreationComponent,

        AbaloneComponent,
        AwaleComponent,
        CoerceoComponent,
        DraughtsComponent,
        DvonnComponent,
        EncapsuleComponent,
        EpaminondasComponent,
        GipfComponent,
        GoComponent,
        KamisadoComponent,
        LinesOfActionComponent,
        MinimaxTestingComponent,
        P4Component,
        PentagoComponent,
        PylosComponent,
        QuartoComponent,
        QuixoComponent,
        ReversiComponent,
        SaharaComponent,
        SiamComponent,
        SixComponent,
        TablutComponent,
        YinshComponent,

        HumanDuration,
    ],
    entryComponents: [
        AbaloneComponent,
        AwaleComponent,
        DraughtsComponent,
        DvonnComponent,
        EncapsuleComponent,
        EpaminondasComponent,
        GipfComponent,
        GoComponent,
        KamisadoComponent,
        LinesOfActionComponent,
        MinimaxTestingComponent,
        P4Component,
        PentagoComponent,
        PylosComponent,
        QuartoComponent,
        QuixoComponent,
        ReversiComponent,
        SaharaComponent,
        SiamComponent,
        SixComponent,
        TablutComponent,
        YinshComponent,
    ],
    imports: [
        BrowserModule,
        HttpClientModule,
        RouterModule.forRoot(routes, { useHash: false }),
        ReactiveFormsModule,
        FormsModule,
        AngularFireModule.initializeApp(environment.firebaseConfig),
        AngularFirestoreModule,
        BrowserAnimationsModule,
    ],
    providers: [
        { provide: USE_FIRESTORE_EMULATOR, useValue: environment.emulatorConfig.firestore },
        AuthenticationService,
        GameService,
        JoinerService,
        UserService,
        ChatService,
        PartDAO,
        AngularFireAuth,
        { provide: LOCALE_ID, useValue: LocaleUtils.getLocale() },
    ],
    bootstrap: [AppComponent],
})
export class AppModule { }
