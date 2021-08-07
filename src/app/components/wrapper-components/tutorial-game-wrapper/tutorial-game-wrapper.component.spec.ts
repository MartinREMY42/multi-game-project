import { TutorialGameWrapperComponent } from './tutorial-game-wrapper.component';
import { TutorialStep } from './TutorialStep';
import { QuartoMove } from 'src/app/games/quarto/QuartoMove';
import { QuartoPartSlice } from 'src/app/games/quarto/QuartoPartSlice';
import { QuartoPiece } from 'src/app/games/quarto/QuartoPiece';
import { ComponentTestUtils } from 'src/app/utils/tests/TestUtils.spec';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { QuartoComponent } from '../../../games/quarto/quarto.component';
import { DebugElement } from '@angular/core';
import { MGPValidation } from 'src/app/utils/MGPValidation';
import { TutorialFailure } from './TutorialFailure';
import { RulesFailure } from 'src/app/jscaip/RulesFailure';
import { Move } from 'src/app/jscaip/Move';
import { LegalityStatus } from 'src/app/jscaip/LegalityStatus';
import { GamePartSlice } from 'src/app/jscaip/GamePartSlice';
import { Coord } from 'src/app/jscaip/Coord';
import { Rules } from 'src/app/jscaip/Rules';
import { Direction } from 'src/app/jscaip/Direction';
import { GameInfo } from '../../normal-component/pick-game/pick-game.component';
import { AbstractGameComponent } from '../../game-components/abstract-game-component/AbstractGameComponent';

import { EpaminondasRules } from 'src/app/games/epaminondas/EpaminondasRules';
import { EpaminondasPartSlice } from 'src/app/games/epaminondas/EpaminondasPartSlice';
import { epaminondasTutorial } from '../../../games/epaminondas/EpaminondasTutorial';
import { EpaminondasMove } from 'src/app/games/epaminondas/EpaminondasMove';
import { saharaTutorial } from '../../../games/sahara/SaharaTutorial';
import { SaharaRules } from 'src/app/games/sahara/SaharaRules';
import { SaharaPartSlice } from 'src/app/games/sahara/SaharaPartSlice';
import { SaharaMove } from 'src/app/games/sahara/SaharaMove';
import { SixMove } from 'src/app/games/six/SixMove';
import { SixRules } from 'src/app/games/six/SixRules';
import { SixGameState } from 'src/app/games/six/SixGameState';
import { sixTutorial, SixTutorialMessages } from '../../../games/six/SixTutorial';
import { PentagoRules } from 'src/app/games/pentago/PentagoRules';
import { PentagoGameState } from 'src/app/games/pentago/PentagoGameState';
import { pentagoTutorial } from 'src/app/games/pentago/PentagoTutorial';
import { PentagoMove } from 'src/app/games/pentago/PentagoMove';

describe('TutorialGameWrapperComponent', () => {
    let componentTestUtils: ComponentTestUtils<QuartoComponent>;
    let wrapper: TutorialGameWrapperComponent;

    beforeEach(fakeAsync(async() => {
        componentTestUtils =
            await ComponentTestUtils.forGame<QuartoComponent>('Quarto', TutorialGameWrapperComponent);
        wrapper = componentTestUtils.wrapper as TutorialGameWrapperComponent;
    }));
    describe('Common behavior', () => {
        // ///////////////////////// BEFORE ///////////////////////////////////////
        it('should create', () => {
            expect(componentTestUtils.wrapper).toBeTruthy();
            expect(componentTestUtils.getComponent()).toBeTruthy();
        });
        it('Should show informations bellow/beside the board', fakeAsync(async() => {
            // Given a certain TutorialStep
            const slice: QuartoPartSlice = new QuartoPartSlice([
                [0, 0, 0, 0],
                [0, 1, 2, 3],
                [0, 1, 2, 3],
                [0, 1, 2, 3],
            ], 0, QuartoPiece.BBAA);
            const tutorial: TutorialStep[] = [
                TutorialStep.forClick(
                    'title',
                    'instruction',
                    slice,
                    ['#click_0_0'],
                    'Bravo !',
                    'Perdu.',
                ),
            ];
            // when starting tutorial
            wrapper.startTutorial(tutorial);

            // expect to see step instruction on component
            const expectedMessage: string = 'instruction';
            const currentMessage: string = componentTestUtils.findElement('#currentMessage').nativeElement.innerHTML;
            expect(currentMessage).toBe(expectedMessage);
            const actualSlice: QuartoPartSlice =
                componentTestUtils.getComponent().rules.node.gamePartSlice as QuartoPartSlice;
            expect(actualSlice).toEqual(slice);
        }));
        it('Should show previousMove when set', fakeAsync(async() => {
            // Given a certain TutorialStep
            const slice: QuartoPartSlice = new QuartoPartSlice([
                [0, 0, 0, 0],
                [0, 1, 2, 3],
                [0, 1, 2, 3],
                [0, 1, 2, 3],
            ], 0, QuartoPiece.BBAA);
            const expectedPreviousMove: QuartoMove = new QuartoMove(1, 1, QuartoPiece.AAAB);
            const tutorial: TutorialStep[] = [
                TutorialStep.forClick(
                    'title',
                    'instruction',
                    slice,
                    ['#click_0_0'],
                    'Bravo !',
                    'Perdu.',
                ).withPreviousMove(expectedPreviousMove),
            ];
            // when starting tutorial
            wrapper.startTutorial(tutorial);

            // expect to see setted previous move
            const actualMove: QuartoMove = wrapper.gameComponent.rules.node.move as QuartoMove;
            expect(expectedPreviousMove).toEqual(actualMove);
        }));
        it('Should show title of the steps, the selected one in bold', fakeAsync(async() => {
            // Given a TutorialStep with 3 steps
            const tutorial: TutorialStep[] = [
                TutorialStep.informational(
                    'title 0',
                    'instruction',
                    QuartoPartSlice.getInitialSlice(),
                ),
                TutorialStep.informational(
                    'title 1',
                    'instruction',
                    QuartoPartSlice.getInitialSlice(),
                ),
                TutorialStep.informational(
                    'title 2',
                    'instruction',
                    QuartoPartSlice.getInitialSlice(),
                ),
            ];
            // when page rendered
            wrapper.startTutorial(tutorial);

            // expect to see three "li" with step title
            let expectedTitle: string = 'title 0';
            let currentTitle: string = componentTestUtils.findElement('#step_0').nativeElement.innerHTML;
            expect(currentTitle).toBe(expectedTitle);
            expectedTitle = 'title 1';
            currentTitle = componentTestUtils.findElement('#step_1').nativeElement.innerHTML;
            expect(currentTitle).toBe(expectedTitle);
        }));
        // ///////////////////////// ATTEMPTING ///////////////////////////////////
        it('Should go to specific step when clicking on it', fakeAsync(async() => {
            // Given a TutorialStep with 3 steps
            const tutorial: TutorialStep[] = [
                TutorialStep.informational(
                    'title 0',
                    'instruction 0',
                    QuartoPartSlice.getInitialSlice(),
                ),
                TutorialStep.informational(
                    'title 1',
                    'instruction 1',
                    QuartoPartSlice.getInitialSlice(),
                ),
                TutorialStep.informational(
                    'title 2',
                    'instruction 2',
                    QuartoPartSlice.getInitialSlice(),
                ),
            ];
            wrapper.startTutorial(tutorial);

            // when selecting a step
            const stepSelection: HTMLSelectElement = componentTestUtils.findElement('#steps').nativeElement;
            stepSelection.value = stepSelection.options[2].value;
            stepSelection.dispatchEvent(new Event('change'));
            componentTestUtils.detectChanges();

            // expect to have the step 2 shown
            const expectedMessage: string = 'instruction 2';
            const currentMessage: string = componentTestUtils.findElement('#currentMessage').nativeElement.innerHTML;
            expect(currentMessage).toBe(expectedMessage);
        }));
        // ///////////////////// Retry ///////////////////////////////////////////////////////////////////
        it('Should start step again after clicking "retry" on step failure', fakeAsync(async() => {
            // Given any TutorialStep where an invalid move has been done
            const tutorial: TutorialStep[] = [
                TutorialStep.fromMove(
                    'title',
                    'instruction',
                    QuartoPartSlice.getInitialSlice(),
                    [new QuartoMove(0, 0, QuartoPiece.BBBB)],
                    'Bravo !',
                    'Perdu.',
                ),
            ];
            wrapper.startTutorial(tutorial);
            await componentTestUtils.expectClickSuccess('#choosePiece_8');
            tick(10);
            const move: QuartoMove = new QuartoMove(1, 1, QuartoPiece.BAAA);
            await componentTestUtils.expectMoveSuccess('#chooseCoord_1_1', move, QuartoPartSlice.getInitialSlice());
            tick(10);

            // when clicking retry
            expect(await componentTestUtils.clickElement('#retryButton')).toBeTrue();

            // expect to see steps instruction message on component and board restarted
            const currentMessage: string =
                componentTestUtils.findElement('#currentMessage').nativeElement.innerHTML;
            expect(currentMessage).toBe('instruction');
            expect(componentTestUtils.getComponent().rules.node.gamePartSlice)
                .toEqual(QuartoPartSlice.getInitialSlice());
        }));
        it('Should start step again after clicking "retry" on step success', fakeAsync(async() => {
            // Given any TutorialStep
            const tutorial: TutorialStep[] = [
                TutorialStep.fromMove(
                    'title',
                    'instruction',
                    QuartoPartSlice.getInitialSlice(),
                    [new QuartoMove(0, 0, QuartoPiece.BBBB)],
                    'Bravo !',
                    'Perdu.',
                ),
            ];
            wrapper.startTutorial(tutorial);
            // when doing another move, then clicking retry
            await componentTestUtils.expectClickSuccess('#choosePiece_15');
            tick(10);
            const move: QuartoMove = new QuartoMove(0, 0, QuartoPiece.BBBB);
            await componentTestUtils.expectMoveSuccess('#chooseCoord_0_0', move, QuartoPartSlice.getInitialSlice());
            tick(10);
            expect(await componentTestUtils.clickElement('#retryButton')).toBeTrue();

            // expect to see steps instruction message on component and board restarted
            const currentMessage: string =
                componentTestUtils.findElement('#currentMessage').nativeElement.innerHTML;
            expect(currentMessage).toBe('instruction');
            expect(componentTestUtils.getComponent().rules.node.gamePartSlice)
                .toEqual(QuartoPartSlice.getInitialSlice());
        }));
        it('Should forbid clicking again on the board after success', fakeAsync(async() => {
            // Given a TutorialStep on which a valid move has been done.
            const tutorial: TutorialStep[] = [
                TutorialStep.fromMove(
                    'title',
                    'Put your piece in a corner and give the opposite one.',
                    QuartoPartSlice.getInitialSlice(),
                    [
                        new QuartoMove(0, 0, QuartoPiece.BBBB),
                        new QuartoMove(0, 3, QuartoPiece.BBBB),
                        new QuartoMove(3, 3, QuartoPiece.BBBB),
                        new QuartoMove(3, 0, QuartoPiece.BBBB),
                    ],
                    'Bravo !',
                    'Perdu.',
                ),
            ];
            wrapper.startTutorial(tutorial);

            await componentTestUtils.expectClickSuccess('#chooseCoord_0_0');
            tick(10);
            const move: QuartoMove = new QuartoMove(0, 0, QuartoPiece.BBBB);
            await componentTestUtils.expectMoveSuccess('#choosePiece_15', move, QuartoPartSlice.getInitialSlice());
            tick(10);

            // when clicking again
            await componentTestUtils.expectClickForbidden('#chooseCoord_2_2', TutorialFailure.STEP_FINISHED);
            tick(10);

            // expect to see still the steps success message on component
            const expectedMessage: string = 'Bravo !';
            const currentMessage: string =
                componentTestUtils.findElement('#currentMessage').nativeElement.innerHTML;
            expect(currentMessage).toBe(expectedMessage);
        }));
        it('Should allow clicking again after restarting succeeded steps', fakeAsync(async() => {
            // Given any TutorialStep whose step has been succeeded and restarted
            wrapper.steps = [
                TutorialStep.forClick(
                    'title',
                    'instruction',
                    QuartoPartSlice.getInitialSlice(),
                    ['#choosePiece_15'],
                    'Bravo !',
                    'Perdu.',
                ),
            ];
            await componentTestUtils.expectClickSuccess('#choosePiece_15');
            expect(await componentTestUtils.clickElement('#retryButton')).toEqual(true, 'Retry button should exist');

            // When trying again
            await componentTestUtils.expectClickSuccess('#choosePiece_15');

            // expect to see success message again
            const currentMessage: string =
                componentTestUtils.findElement('#currentMessage').nativeElement.innerHTML;
            expect(currentMessage).toBe('Bravo !');
            expect(componentTestUtils.getComponent().rules.node.gamePartSlice)
                .toEqual(QuartoPartSlice.getInitialSlice());
        }));
        // /////////////////////// Next /////////////////////////////////////////////////////////
        it('Should allow to skip step', fakeAsync(async() => {
            // Given a TutorialStep with one clic
            wrapper.steps = [
                TutorialStep.forClick(
                    'title',
                    'Explanation Explanation Explanation.',
                    QuartoPartSlice.getInitialSlice(),
                    ['chooseCoord_0_0'],
                    'Bravo !',
                    'Perdu.',
                ),
                TutorialStep.forClick(
                    'title',
                    'Following Following Following.',
                    QuartoPartSlice.getInitialSlice(),
                    ['#chooseCoord_0_0'],
                    'Fini.',
                    'Reperdu.',
                ),
            ];
            // when clicking "Skip"
            expect(await componentTestUtils.clickElement('#nextButton')).toBeTrue();

            // expect to see next step on component
            const expectedMessage: string = 'Following Following Following.';
            const currentMessage: string =
                componentTestUtils.findElement('#currentMessage').nativeElement.innerHTML;
            expect(currentMessage).toBe(expectedMessage);
            expect(wrapper.stepFinished[0]).toBeFalse();
        }));
        it('Should move to the next unfinished step when next step is finished', fakeAsync(async() => {
            // Given a tutorial on which the two first steps have been skipped
            const tutorial: TutorialStep[] = [
                TutorialStep.forClick(
                    'title 0',
                    'instruction 0',
                    QuartoPartSlice.getInitialSlice(),
                    ['#chooseCoord_0_0'],
                    'Bravo !',
                    'Perdu.',
                ),
                TutorialStep.forClick(
                    'title 1',
                    'instruction 1',
                    QuartoPartSlice.getInitialSlice(),
                    ['#chooseCoord_1_1'],
                    'Bravo !',
                    'Perdu.',
                ),
                TutorialStep.forClick(
                    'title 2',
                    'instruction 2',
                    QuartoPartSlice.getInitialSlice(),
                    ['#chooseCoord_2_2'],
                    'Bravo !',
                    'Perdu.',
                ),
            ];
            wrapper.startTutorial(tutorial);
            expect(await componentTestUtils.clickElement('#nextButton')).toBeTrue();
            expect(await componentTestUtils.clickElement('#nextButton')).toBeTrue();
            await componentTestUtils.expectClickSuccess('#chooseCoord_2_2');

            // When clicking next
            expect(await componentTestUtils.clickElement('#nextButton')).toBeTrue();

            // expect to be back at first step
            const expectedMessage: string = 'instruction 0';
            const currentMessage: string =
                componentTestUtils.findElement('#currentMessage').nativeElement.innerHTML;
            expect(currentMessage).toBe(expectedMessage);
        }));
        it('Should move to the first unfinished step when all next steps are finished', fakeAsync(async() => {
            // Given a tutorial on which the middle steps have been skipped
            const tutorial: TutorialStep[] = [
                TutorialStep.forClick(
                    'title 0',
                    'instruction 0',
                    QuartoPartSlice.getInitialSlice(),
                    ['#chooseCoord_0_0'],
                    'Bravo !',
                    'Perdu.',
                ),
                TutorialStep.forClick(
                    'title 1',
                    'instruction 1',
                    QuartoPartSlice.getInitialSlice(),
                    ['#chooseCoord_1_1'],
                    'Bravo !',
                    'Perdu.',
                ),
                TutorialStep.forClick(
                    'title 2',
                    'instruction 2',
                    QuartoPartSlice.getInitialSlice(),
                    ['#chooseCoord_2_2'],
                    'Bravo !',
                    'Perdu.',
                ),
            ];
            wrapper.startTutorial(tutorial);
            expect(await componentTestUtils.clickElement('#nextButton')).toBeTrue(); // Go to 1
            await componentTestUtils.expectClickSuccess('#chooseCoord_1_1'); // Do 1
            expect(await componentTestUtils.clickElement('#nextButton')).toBeTrue(); // Go to 2
            expect(await componentTestUtils.clickElement('#nextButton')).toBeTrue(); // Go to 0

            // When clicking next
            expect(await componentTestUtils.clickElement('#nextButton')).toBeTrue(); // Should go to 2

            // expect to be back at first step
            const expectedMessage: string = 'instruction 2';
            const currentMessage: string =
                componentTestUtils.findElement('#currentMessage').nativeElement.innerHTML;
            expect(currentMessage).toBe(expectedMessage);
        }));
        it('Should show congratulation and play buttons at the end of the tutorial, hide next button', fakeAsync(async() => {
            // Given a TutorialStep whose last step has been done
            const tutorial: TutorialStep[] = [
                TutorialStep.forClick(
                    'title 0',
                    'instruction 0',
                    QuartoPartSlice.getInitialSlice(),
                    ['#chooseCoord_0_0'],
                    'Bravo !',
                    'Perdu.',
                ),
            ];
            wrapper.startTutorial(tutorial);
            await componentTestUtils.expectClickSuccess('#chooseCoord_0_0');

            // when clicking next button
            expect(await componentTestUtils.clickElement('#nextButton')).toBeTrue();

            // expect to see end tutorial congratulations
            const expectedMessage: string = wrapper.COMPLETED_TUTORIAL_MESSAGE;
            const currentMessage: string =
                componentTestUtils.findElement('#currentMessage').nativeElement.innerHTML;
            expect(wrapper.successfulSteps).toBe(1);
            expect(currentMessage).toBe(expectedMessage);
            // expect next button to be hidden
            componentTestUtils.expectElementNotToExist('#nextButton');
            // expect retry button to be hidden
            componentTestUtils.expectElementNotToExist('#retryButton');
            // expect restart button to be here
            expect(await componentTestUtils.clickElement('#restartButton')).toBeTrue();
            expect(wrapper.successfulSteps).toBe(0);
        }));
        it('Should allow to restart the whole tutorial when finished', fakeAsync(async() => {
            // Given a finished tutorial
            wrapper.startTutorial([
                TutorialStep.informational(
                    'title 0',
                    'instruction 0',
                    QuartoPartSlice.getInitialSlice(),
                ),
            ]);
            expect(await componentTestUtils.clickElement('#nextButton')).toBeTrue();

            // when clicking restart
            expect(await componentTestUtils.clickElement('#restartButton')).toBeTrue();

            // expect to be back on first step
            const currentMessage: string =
                componentTestUtils.findElement('#currentMessage').nativeElement.innerHTML;
            expect(currentMessage).toBe(wrapper.steps[0].instruction);
            expect(wrapper.stepFinished.every((v: boolean) => v === false)).toBeTrue();
            expect(wrapper.stepIndex).toEqual(0);
        }));
        it('Should redirect to local game when asking for it when finished', fakeAsync(async() => {
            // Given a finish tutorial
            wrapper.startTutorial([
                TutorialStep.informational(
                    'title 0',
                    'instruction 0',
                    QuartoPartSlice.getInitialSlice(),
                ),
            ]);
            componentTestUtils.expectElementNotToExist('#playLocallyButton');
            expect(await componentTestUtils.clickElement('#nextButton')).toBeTrue();

            // when clicking play locally
            spyOn(componentTestUtils.wrapper.router, 'navigate').and.callThrough();
            expect(await componentTestUtils.clickElement('#playLocallyButton')).toBeTrue();

            // expect navigator to have been called
            expect(componentTestUtils.wrapper.router.navigate).toHaveBeenCalledWith(['local/Quarto']);
        }));
        it('Should redirect to online game when asking for it when finished and user is online', fakeAsync(async() => {
            // Given a finish tutorial
            wrapper.startTutorial([
                TutorialStep.informational(
                    'title 0',
                    'instruction 0',
                    QuartoPartSlice.getInitialSlice(),
                ),
            ]);
            componentTestUtils.expectElementNotToExist('#playOnlineButton');
            expect(await componentTestUtils.clickElement('#nextButton')).toBeTrue();

            // when clicking play locally
            const compo: TutorialGameWrapperComponent =
                componentTestUtils.wrapper as TutorialGameWrapperComponent;
            spyOn(compo.gameService, 'createGameAndRedirectOrShowError').and.callThrough();
            expect(await componentTestUtils.clickElement('#playOnlineButton')).toBeTrue();

            // expect navigator to have been called
            expect(compo.gameService.createGameAndRedirectOrShowError).toHaveBeenCalledWith('Quarto');

            tick(1000);
        }));
    });
    describe('TutorialStep awaiting specific moves', () => {
        it('Should show highlight of first click on multiclick game component', fakeAsync(async() => {
            // Given a TutorialStep with several moves
            const tutorial: TutorialStep[] = [
                TutorialStep.fromMove(
                    'title',
                    'Put your piece in a corner and give the opposite one.',
                    QuartoPartSlice.getInitialSlice(),
                    [
                        new QuartoMove(0, 0, QuartoPiece.BBBB),
                        new QuartoMove(0, 3, QuartoPiece.BBBB),
                        new QuartoMove(3, 3, QuartoPiece.BBBB),
                        new QuartoMove(3, 0, QuartoPiece.BBBB),
                    ],
                    'Bravo !',
                    'Perdu.',
                ),
            ];
            wrapper.startTutorial(tutorial);

            // when doing that move
            await componentTestUtils.expectClickSuccess('#chooseCoord_3_3');
            tick(11);

            // expect highlight to be present
            const element: DebugElement = componentTestUtils.findElement('#highlight');
            expect(element).toBeTruthy('Highlight should be present');
        }));
        it('Should show success message after step success', fakeAsync(async() => {
            // Given a TutorialStep with several moves
            const tutorial: TutorialStep[] = [
                TutorialStep.fromMove(
                    'title',
                    'Put your piece in a corner and give the opposite one.',
                    QuartoPartSlice.getInitialSlice(),
                    [
                        new QuartoMove(0, 0, QuartoPiece.BBBB),
                        new QuartoMove(0, 3, QuartoPiece.BBBB),
                        new QuartoMove(3, 3, QuartoPiece.BBBB),
                        new QuartoMove(3, 0, QuartoPiece.BBBB),
                    ],
                    'Bravo !',
                    'Perdu.',
                ),
            ];
            wrapper.startTutorial(tutorial);

            // when doing that move
            await componentTestUtils.expectClickSuccess('#chooseCoord_0_0');
            tick(10);
            const move: QuartoMove = new QuartoMove(0, 0, QuartoPiece.BBBB);
            await componentTestUtils.expectMoveSuccess('#choosePiece_15', move, QuartoPartSlice.getInitialSlice());
            tick(10);

            // expect to see steps success message on component
            const expectedMessage: string = 'Bravo !';
            const currentMessage: string =
                componentTestUtils.findElement('#currentMessage').nativeElement.innerHTML;
            expect(currentMessage).toBe(expectedMessage);
        }));
        it('Should show failure message after step failure', fakeAsync(async() => {
            // Given a TutorialStep with several move
            const tutorial: TutorialStep[] = [
                TutorialStep.fromMove(
                    'title',
                    'Put your piece in a corner and give the opposite one.',
                    QuartoPartSlice.getInitialSlice(),
                    [
                        new QuartoMove(0, 0, QuartoPiece.BBBB),
                        new QuartoMove(0, 3, QuartoPiece.BBBB),
                        new QuartoMove(3, 3, QuartoPiece.BBBB),
                        new QuartoMove(3, 0, QuartoPiece.BBBB),
                    ],
                    'Bravo !',
                    'Perdu.',
                ),
            ];
            wrapper.startTutorial(tutorial);

            // when doing another move
            await componentTestUtils.expectClickSuccess('#chooseCoord_1_1');
            tick(10);
            const move: QuartoMove = new QuartoMove(1, 1, QuartoPiece.BBBB);
            await componentTestUtils.expectMoveSuccess('#choosePiece_15', move, QuartoPartSlice.getInitialSlice());
            tick(10);

            // expect to see steps success message on component
            const expectedReason: string = 'Perdu.';
            const currentReason: string =
                componentTestUtils.findElement('#currentReason').nativeElement.innerHTML;
            expect(currentReason).toBe(expectedReason);
        }));
        it('When illegal move is done, toast message should be shown and restart not needed', fakeAsync(async() => {
            // given tutorial awaiting any move, but mocking rules to make it mark a move illegal
            const tutorial: TutorialStep[] = [
                TutorialStep.anyMove(
                    'title',
                    'instruction',
                    QuartoPartSlice.getInitialSlice(),
                    new QuartoMove(0, 0, QuartoPiece.BABA),
                    'Bravo !',
                ),
            ];
            wrapper.startTutorial(tutorial);

            // when doing a (virtually) illegal move
            const error: string = 'message de la erreur monsieur...';
            spyOn(wrapper.gameComponent.rules, 'isLegal').and.returnValue({ legal: MGPValidation.failure(error) });
            await componentTestUtils.expectClickSuccess('#chooseCoord_0_0');
            tick(10);
            const move: QuartoMove = new QuartoMove(0, 0, QuartoPiece.BBBB);
            await componentTestUtils.expectMoveFailure('#choosePiece_15', error, move);
            tick(10);

            // expect to see message error
            const expectedReason: string = error;
            const currentReason: string =
                componentTestUtils.findElement('#currentReason').nativeElement.innerHTML;
            expect(currentReason).toBe(expectedReason);
        }));
        it('When illegal click is tried, toast message should be shown and restart not needed', fakeAsync(async() => {
            // Given a TutorialStep on which illegal move has been tried
            const tutorial: TutorialStep[] = [
                TutorialStep.fromMove(
                    'title 0',
                    'instruction 0.',
                    new QuartoPartSlice([
                        [0, 16, 16, 16],
                        [16, 16, 16, 16],
                        [16, 16, 16, 16],
                        [16, 16, 16, 16],
                    ], 0, QuartoPiece.ABBA),
                    [new QuartoMove(3, 3, QuartoPiece.BBBB)],
                    'Bravo !',
                    'Perdu.',
                ),
            ];
            wrapper.startTutorial(tutorial);
            await componentTestUtils.expectClickFailure('#chooseCoord_0_0', RulesFailure.MUST_CLICK_ON_EMPTY_SPACE);
            tick(10);

            // expect to see cancelMove reason as message
            const expectedMessage: string = 'instruction 0.';
            const currentMessage: string =
                componentTestUtils.findElement('#currentMessage').nativeElement.innerHTML;
            expect(currentMessage).toBe(expectedMessage);
            const currentReason: string =
                componentTestUtils.findElement('#currentReason').nativeElement.innerHTML;
            expect(currentReason).toBe(RulesFailure.MUST_CLICK_ON_EMPTY_SPACE);
            // expect click to be still possible
            expect(componentTestUtils.getComponent().canUserPlay('#chooseCoord_0_0').isSuccess()).toBeTrue();
            tick(10);
        }));
        it('Should propose to see the solution when move attempt done', fakeAsync(async() => {
            // Given a tutorial on which a non-awaited move has been done
            const awaitedMove: QuartoMove = new QuartoMove(3, 3, QuartoPiece.BBAA);
            const stepInitialTurn: number = 0;
            const tutorial: TutorialStep[] = [
                TutorialStep.fromMove(
                    'title 0',
                    'instruction 0.',
                    new QuartoPartSlice([
                        [0, 16, 16, 16],
                        [16, 16, 16, 16],
                        [16, 16, 16, 16],
                        [16, 16, 16, 16],
                    ], stepInitialTurn, QuartoPiece.ABBA),
                    [awaitedMove],
                    'Bravo !',
                    'Perdu.',
                ),
            ];
            wrapper.startTutorial(tutorial);
            await componentTestUtils.expectClickSuccess('#chooseCoord_1_1');
            tick(10);
            const move: QuartoMove = new QuartoMove(1, 1, QuartoPiece.BAAA);
            await componentTestUtils.expectMoveSuccess('#choosePiece_8', move);
            tick(10);
            expect(wrapper.moveAttemptMade).toBeTrue();
            expect(wrapper.stepFinished[wrapper.stepIndex])
                .toBeFalse();

            // When clicking "Show Solution"
            expect(await componentTestUtils.clickElement('#showSolutionButton')).toBeTrue();

            // Expect the first awaited move to have been done
            expect(componentTestUtils.getComponent().rules.node.move).toEqual(awaitedMove);
            expect(componentTestUtils.getComponent().rules.node.gamePartSlice.turn).toEqual(stepInitialTurn + 1);
            // expect 'solution' message to be shown
            const currentMessage: string =
                componentTestUtils.findElement('#currentMessage').nativeElement.innerHTML;
            expect(currentMessage).toBe('Bravo !');
            // expect step not to be considered a success
            expect(wrapper.stepFinished[wrapper.stepIndex])
                .toBeFalse();
        }));
    });
    describe('TutorialStep awaiting any move', () => {
        it('Should consider any move legal when step is anyMove', fakeAsync(async() => {
            // given tutorial step fo type "anyMove"
            const tutorial: TutorialStep[] = [
                TutorialStep.anyMove(
                    'title',
                    'instruction',
                    QuartoPartSlice.getInitialSlice(),
                    new QuartoMove(0, 0, QuartoPiece.BABA),
                    'Bravo !',
                ),
            ];
            wrapper.startTutorial(tutorial);

            // when doing any move
            await componentTestUtils.expectClickSuccess('#chooseCoord_0_0');
            tick(10);
            const move: QuartoMove = new QuartoMove(0, 0, QuartoPiece.BBBB);
            await componentTestUtils.expectMoveSuccess('#choosePiece_15', move, QuartoPartSlice.getInitialSlice());
            tick(10);

            // expect to see steps success message on component
            const expectedMessage: string = 'Bravo !';
            const currentMessage: string =
                componentTestUtils.findElement('#currentMessage').nativeElement.innerHTML;
            expect(currentMessage).toBe(expectedMessage);
        }));
    });
    describe('TutorialStep awaiting a click (deprecated)', () => {
        it('Should show success message after step success (one of several clics)', fakeAsync(async() => {
            // Given a TutorialStep with several clics
            const tutorial: TutorialStep[] = [
                TutorialStep.forClick(
                    'title',
                    'Click on (0, 0) or (3, 3)',
                    QuartoPartSlice.getInitialSlice(),
                    ['#chooseCoord_0_0', '#chooseCoord_3_3'],
                    'Bravo !',
                    'Perdu.',
                ),
            ];
            wrapper.startTutorial(tutorial);

            // when doing that move
            await componentTestUtils.expectClickSuccess('#chooseCoord_0_0');

            // expect to see steps success message on component
            const expectedMessage: string = 'Bravo !';
            const currentMessage: string =
                componentTestUtils.findElement('#currentMessage').nativeElement.innerHTML;
            expect(currentMessage).toBe(expectedMessage);
        }));
        it('Should show failure message after step failure (one of several clics)', fakeAsync(async() => {
            // Given a TutorialStep with several clics
            const tutorial: TutorialStep[] = [
                TutorialStep.forClick(
                    'title',
                    'Click on (0, 0) or (3, 3)',
                    QuartoPartSlice.getInitialSlice(),
                    ['#chooseCoord_0_0', '#chooseCoord_3_3'],
                    'Bravo !',
                    'Perdu.',
                ),
            ];
            wrapper.startTutorial(tutorial);

            // when doing another move
            await componentTestUtils.expectClickSuccess('#chooseCoord_1_1');

            // expect to see steps success message on component
            const expectedMessage: string = 'Perdu.';
            const currentMessage: string =
                componentTestUtils.findElement('#currentMessage').nativeElement.innerHTML;
            expect(currentMessage).toBe(expectedMessage);
        }));
        it('When unwanted click, and no move done, restart should not be needed', fakeAsync(async() => {
            // Given a TutorialStep with possible invalid clicks
            const tutorial: TutorialStep[] = [
                TutorialStep.forClick(
                    'title 0',
                    'instruction 0.',
                    new QuartoPartSlice([
                        [0, 16, 16, 16],
                        [16, 16, 16, 16],
                        [16, 16, 16, 16],
                        [16, 16, 16, 16],
                    ], 0, QuartoPiece.ABBA),
                    ['#chooseCoord_3_3'],
                    'Bravo !',
                    'Perdu.',
                ),
            ];
            wrapper.startTutorial(tutorial);

            // When doing invalid click
            await componentTestUtils.expectClickFailure('#chooseCoord_0_0', RulesFailure.MUST_CLICK_ON_EMPTY_SPACE);

            // expect to see cancelMove reason as message
            const expectedMessage: string = 'Perdu.';
            const currentMessage: string =
                componentTestUtils.findElement('#currentMessage').nativeElement.innerHTML;
            expect(currentMessage).toBe(expectedMessage);
            const currentReason: string =
                componentTestUtils.findElement('#currentReason').nativeElement.innerHTML;
            expect(currentReason).toBe(RulesFailure.MUST_CLICK_ON_EMPTY_SPACE);
            // expect click to be still possible
            expect(componentTestUtils.getComponent().canUserPlay('#chooseCoord_0_0').isSuccess()).toBeTrue();
        }));
    });
    describe('Informational TutorialStep', () => {
        it('Should forbid clicking on the board', fakeAsync(async() => {
            // Given a TutorialStep on which nothing is awaited
            const tutorial: TutorialStep[] = [
                TutorialStep.informational(
                    'title 0',
                    'instruction 0',
                    QuartoPartSlice.getInitialSlice(),
                ),
            ];
            wrapper.startTutorial(tutorial);

            // when clicking
            await componentTestUtils.expectClickForbidden('#chooseCoord_2_2', TutorialFailure.INFORMATIONAL_STEP);

            // expect to see still the steps success message on component
            const expectedMessage: string = 'instruction 0';
            const currentMessage: string =
                componentTestUtils.findElement('#currentMessage').nativeElement.innerHTML;
            expect(currentMessage).toBe(expectedMessage);
        }));
        it('Should mark step as finished when skipped', fakeAsync(async() => {
            // Given a TutorialStep with no action to do
            const tutorial: TutorialStep[] = [
                TutorialStep.informational(
                    'title',
                    'Explanation Explanation Explanation.',
                    QuartoPartSlice.getInitialSlice(),
                ),
                TutorialStep.informational(
                    'title',
                    'Suite suite.',
                    QuartoPartSlice.getInitialSlice(),
                ),
            ];
            wrapper.startTutorial(tutorial);
            // when clicking "Next Button"
            const nextButtonMessage: string =
                componentTestUtils.findElement('#nextButton').nativeElement.textContent;
            expect(nextButtonMessage).toBe('Ok');
            expect(await componentTestUtils.clickElement('#nextButton')).toBeTrue();

            // expect to see next step on component
            const expectedMessage: string = 'Suite suite.';
            const currentMessage: string =
                componentTestUtils.findElement('#currentMessage').nativeElement.innerHTML;
            expect(currentMessage).toBe(expectedMessage);
            expect(wrapper.stepFinished[0]).toBeTrue();
        }));
    });
    describe('TutorialStep awaiting a predicate', () => {
        it('Should display MGPValidation.reason when predicate return a failure', fakeAsync(async() => {
            // Given a TutorialStep that always fail
            const tutorial: TutorialStep[] = [
                TutorialStep.fromPredicate(
                    'title',
                    'You shall not pass',
                    QuartoPartSlice.getInitialSlice(),
                    new QuartoMove(1, 1, QuartoPiece.BAAB),
                    (move: QuartoMove, resultingState: QuartoPartSlice) => {
                        return MGPValidation.failure('chocolatine');
                    },
                    'Bravo !',
                ),
            ];
            wrapper.startTutorial(tutorial);

            // when doing a move
            await componentTestUtils.expectClickSuccess('#chooseCoord_0_0');
            tick(10);
            const move: QuartoMove = new QuartoMove(0, 0, QuartoPiece.BBBB);
            await componentTestUtils.expectMoveSuccess('#choosePiece_15', move, QuartoPartSlice.getInitialSlice());
            tick(10);

            // expect to see steps success message on component
            const expectedReason: string = 'chocolatine';
            const currentReason: string =
                componentTestUtils.findElement('#currentReason').nativeElement.innerHTML;
            expect(currentReason).toBe(expectedReason);
        }));
        it('Should display successMessage when predicate return MGPValidation.SUCCESS', fakeAsync(async() => {
            // Given a TutorialStep with several clics
            const tutorial: TutorialStep[] = [
                TutorialStep.fromPredicate(
                    'title',
                    'No matter what you do, it will be success!',
                    QuartoPartSlice.getInitialSlice(),
                    new QuartoMove(1, 1, QuartoPiece.BAAB),
                    (move: QuartoMove, resultingState: QuartoPartSlice) => {
                        return MGPValidation.SUCCESS;
                    },
                    'Bravo !',
                ),
            ];
            wrapper.startTutorial(tutorial);

            // when doing a move
            await componentTestUtils.expectClickSuccess('#chooseCoord_0_0');
            tick(10);
            const move: QuartoMove = new QuartoMove(0, 0, QuartoPiece.BBBB);
            await componentTestUtils.expectMoveSuccess('#choosePiece_15', move, QuartoPartSlice.getInitialSlice());
            tick(10);

            // expect to see steps success message on component
            const expectedMessage: string = 'Bravo !';
            const currentMessage: string =
                componentTestUtils.findElement('#currentMessage').nativeElement.innerHTML;
            expect(currentMessage).toBe(expectedMessage);
        }));
    });
    describe('showSolution', () => {
        it('Should work with Tutorial step other than "list of moves"', fakeAsync(async() => {
            // Given a TutorialStep on which we failed to success
            const solutionMove: QuartoMove = new QuartoMove(1, 1, QuartoPiece.BAAB);
            const tutorial: TutorialStep[] = [
                TutorialStep.fromPredicate(
                    'title',
                    'You will have to ask me for solution anyway',
                    QuartoPartSlice.getInitialSlice(),
                    solutionMove,
                    (move: QuartoMove, resultingState: QuartoPartSlice) => {
                        return MGPValidation.failure('what did I say ?');
                    },
                    'Bravo !',
                ),
            ];
            wrapper.startTutorial(tutorial);
            await componentTestUtils.expectClickSuccess('#chooseCoord_0_0');
            tick(10);
            const proposedMove: QuartoMove = new QuartoMove(0, 0, QuartoPiece.BBBB);
            await componentTestUtils.expectMoveSuccess('#choosePiece_15', proposedMove, QuartoPartSlice.getInitialSlice());
            tick(10);

            // When clicking "Show Solution"
            expect(await componentTestUtils.clickElement('#showSolutionButton')).toBeTrue();

            // Expect the step proposed move to have been done
            expect(componentTestUtils.getComponent().rules.node.move).toEqual(solutionMove);
            expect(componentTestUtils.getComponent().rules.node.gamePartSlice.turn).toEqual(1);
            // expect 'solution' message to be shown
            const currentMessage: string =
                componentTestUtils.findElement('#currentMessage').nativeElement.innerHTML;
            expect(currentMessage).toBe('Bravo !');
            // expect step not to be considered a success
            expect(wrapper.stepFinished[wrapper.stepIndex]).toBeFalse();
        }));
    });
    describe('Tutorials', () => {
        it('Should make sure that predicate step have healthy behaviors', fakeAsync(async() => {
            const stepExpectations: [Rules<Move, GamePartSlice>, TutorialStep, Move, MGPValidation][] = [
                [
                    new EpaminondasRules(EpaminondasPartSlice),
                    epaminondasTutorial[3],
                    new EpaminondasMove(0, 11, 2, 1, Direction.UP),
                    MGPValidation.failure(`Congratulations, you are in advance. But this is not the exercise here, try again.`),
                ], [
                    new EpaminondasRules(EpaminondasPartSlice),
                    epaminondasTutorial[4],
                    new EpaminondasMove(0, 10, 1, 1, Direction.UP),
                    MGPValidation.failure(`Failed! You moved only one piece.`),
                ], [
                    new PentagoRules(PentagoGameState),
                    pentagoTutorial[2],
                    PentagoMove.withRotation(0, 0, 0, true),
                    MGPValidation.failure($localize`You have made a move with a rotation. This tutorial step is about moves without rotations!`),
                ], [
                    new PentagoRules(PentagoGameState),
                    pentagoTutorial[3],
                    PentagoMove.rotationless(0, 0),
                    MGPValidation.failure($localize`You made a move without rotation, try again!`),
                ], [
                    new SaharaRules(SaharaPartSlice),
                    saharaTutorial[2],
                    new SaharaMove(new Coord(7, 0), new Coord(5, 0)),
                    MGPValidation.failure(`You have made a double step, which is good but it is the next exercise!`),
                ], [
                    new SaharaRules(SaharaPartSlice),
                    saharaTutorial[3],
                    new SaharaMove(new Coord(2, 0), new Coord(2, 1)),
                    MGPValidation.failure(`Failed! You have made a single step.`),
                ], [
                    new SixRules(SixGameState),
                    sixTutorial[4],
                    SixMove.fromDeplacement(new Coord(6, 1), new Coord(7, 1)),
                    MGPValidation.failure(SixTutorialMessages.MOVEMENT_NOT_DISCONNECTING),
                ], [
                    new SixRules(SixGameState),
                    sixTutorial[4],
                    SixMove.fromDeplacement(new Coord(6, 1), new Coord(6, 0)),
                    MGPValidation.failure(SixTutorialMessages.MOVEMENT_SELF_DISCONNECTING),
                ], [
                    new SixRules(SixGameState),
                    sixTutorial[5],
                    SixMove.fromDeplacement(new Coord(0, 6), new Coord(1, 6)),
                    MGPValidation.failure(`This move does not disconnect your opponent's pieces. Try again with another piece.`),
                ], [
                    new SixRules(SixGameState),
                    sixTutorial[6],
                    SixMove.fromDeplacement(new Coord(2, 3), new Coord(3, 3)),
                    MGPValidation.failure(`This move has not cut the board in two equal halves.`),
                ], [
                    new SixRules(SixGameState),
                    sixTutorial[6],
                    SixMove.fromCut(new Coord(2, 3), new Coord(1, 3), new Coord(3, 2)),
                    MGPValidation.failure(`Failed. You did cut the board in two but you kept the half where you're in minority. Therefore, you lost! Try again.`),
                ],
            ];
            for (const stepExpectation of stepExpectations) {
                const rules: Rules<Move, GamePartSlice> = stepExpectation[0];
                const step: TutorialStep = stepExpectation[1];
                const move: Move = stepExpectation[2];
                const validation: MGPValidation = stepExpectation[3];
                const status: LegalityStatus = rules.isLegal(move, step.state);
                expect(status.legal.reason).toBeNull();
                const state: GamePartSlice = rules.applyLegalMove(move, step.state, status);
                expect(step.predicate(move, state)).toEqual(validation);
            }
        }));
        it('Should make sure all solutionMove are legal', fakeAsync(async() => {
            for (const gameInfo of GameInfo.ALL_GAMES) {
                if (gameInfo.display === false) {
                    continue;
                }
                const gameComponent: AbstractGameComponent<Move, GamePartSlice> =
                    TestBed.createComponent(gameInfo.component).debugElement.componentInstance;
                const rules: Rules<Move, GamePartSlice> = gameComponent.rules;
                const steps: TutorialStep[] = gameComponent.tutorial;
                for (const step of steps) {
                    if (step.solutionMove != null) {
                        const status: LegalityStatus = rules.isLegal(step.solutionMove, step.state);
                        expect(status.legal.reason).toBeNull();
                        if (step.isPredicate()) {
                            const state: GamePartSlice = rules.applyLegalMove(step.solutionMove, step.state, status);
                            expect(step.predicate(step.solutionMove, state)).toEqual(MGPValidation.SUCCESS);
                        }
                    }
                }
            }
        }));
    });
});