/* eslint-disable max-lines-per-function */
import { DebugElement } from '@angular/core';
import { fakeAsync } from '@angular/core/testing';
import { Coord } from 'src/app/jscaip/Coord';
import { Table } from 'src/app/utils/ArrayUtils';
import { MGPOptional } from 'src/app/utils/MGPOptional';
import { ComponentTestUtils } from 'src/app/utils/tests/TestUtils.spec';
import { MartianChessComponent, MartianChessFace } from '../martian-chess.component';
import { MartianChessMove } from '../MartianChessMove';
import { MartianChessState } from '../MartianChessState';
import { MartianChessPiece } from '../MartianChessPiece';
import { DirectionFailure } from 'src/app/jscaip/Direction';
import { RulesFailure } from 'src/app/jscaip/RulesFailure';

describe('MartianChessComponent', () => {

    let componentTestUtils: ComponentTestUtils<MartianChessComponent>;

    const _: MartianChessPiece = MartianChessPiece.EMPTY;
    const A: MartianChessPiece = MartianChessPiece.PAWN;
    const B: MartianChessPiece = MartianChessPiece.DRONE;
    const C: MartianChessPiece = MartianChessPiece.QUEEN;

    beforeEach(fakeAsync(async() => {
        componentTestUtils = await ComponentTestUtils.forGame<MartianChessComponent>('MartianChess');
    }));
    it('should show selected piece when clicking on it', fakeAsync(async() => {
        // Given the initial board
        // When clicking on on of your pieces
        await componentTestUtils.expectClickSuccess('#click_2_2');

        // Then the piece should have a highlighted style
        componentTestUtils.expectElementToHaveClass('#pawn_2_2', 'highlighted');
    }));
    it('should show indicators of next possible click once piece is selected', fakeAsync(async() => {
        // Given any board where displacement, capture and promotions are all possible
        const board: Table<MartianChessPiece> = [
            [_, _, _, _],
            [_, _, _, _],
            [C, C, B, _],
            [_, _, _, _],

            [_, _, B, A],
            [_, B, _, _],
            [_, _, _, _],
            [_, _, _, _],
        ];
        const state: MartianChessState = new MartianChessState(board, 1);
        componentTestUtils.setupState(state);

        // When selecting a piece able to do capture/promotion/displacement
        await componentTestUtils.expectClickSuccess('#click_2_4');

        // Then all those options should be shown as a landing coord
        componentTestUtils.expectElementToExist('#indicator_2_2'); // capturable opponent
        componentTestUtils.expectElementToExist('#indicator_2_3'); // displacement
        componentTestUtils.expectElementToExist('#indicator_3_3'); // displacement

        componentTestUtils.expectElementToExist('#indicator_3_4'); // promotion
        componentTestUtils.expectElementToExist('#indicator_3_5'); // displacement

        componentTestUtils.expectElementToExist('#indicator_2_6'); // displacement
        componentTestUtils.expectElementToExist('#indicator_2_5'); // displacement
        componentTestUtils.expectElementNotToExist('#indicator_0_6'); // illegal displacement
        componentTestUtils.expectElementNotToExist('#indicator_1_5'); // illegal promotion

        componentTestUtils.expectElementToExist('#indicator_0_4'); // displacement
        componentTestUtils.expectElementToExist('#indicator_1_4'); // displacement
        componentTestUtils.expectElementToExist('#indicator_0_2'); // capturable opponent
        componentTestUtils.expectElementToExist('#indicator_1_3'); // displacement
    }));
    it('should not select opponent piece', fakeAsync(async() => {
        // Given the initial board

        // When clicking an opponent piece
        await componentTestUtils.expectClickSuccess('#click_3_7');

        // Then it should not select the piece but not toast error
        componentTestUtils.expectElementNotToHaveClass('#queen_3_7', 'highlighted');
    }));
    it('should not select empty case', fakeAsync(async() => {
        // Given the initial board
        // When clicking an empty case immediately
        // Then it should not toast
        await componentTestUtils.expectClickSuccess('#click_0_3');
    }));
    it('should cancel move attempt when clicking twice on the same piece', fakeAsync(async() => {
        // Given a board with a selected piece
        await componentTestUtils.expectClickSuccess('#click_2_2');

        // When clicking on the piece again
        await componentTestUtils.expectClickSuccess('#click_2_2');

        // Then the piece should be deselected
        componentTestUtils.expectElementNotToHaveClass('#pawn_2_2', 'highlighted');
    }));
    it('should not throw when attempting invalid move', fakeAsync(async() => {
        // Given a board where a first click was done
        await componentTestUtils.expectClickSuccess('#click_2_2');

        // When cliking on a invalid second coord
        // Then the move should have been illegal
        const reason: string = DirectionFailure.DIRECTION_MUST_BE_LINEAR();
        await componentTestUtils.expectClickFailure('#click_3_4', reason);
    }));
    it('should change selectedPiece when second clicking on a non-landable friendly piece', fakeAsync(async() => {
        // Given a board where a first click was done
        await componentTestUtils.expectClickSuccess('#click_0_0');

        // When cliking on one of your other piece that cannot be your landing coord
        await componentTestUtils.expectClickSuccess('#click_1_1');

        // Then the move should not have been cancelled but the first piece selected changed
        componentTestUtils.expectElementToHaveClass('#drone_1_1', 'highlighted');
    }));
    it('should propose illegal move so that a toast is given to explain', fakeAsync(async() => {
        // Given a board where a first click was done
        await componentTestUtils.expectClickSuccess('#click_0_0');

        // When clicking on a fully illegal coord
        // Then the move should be illegal
        const reason: string = RulesFailure.SOMETHING_IN_THE_WAY();
        const move: MartianChessMove = MartianChessMove.from(new Coord(0, 0), new Coord(3, 3)).get();
        await componentTestUtils.expectMoveFailure('#click_3_3', reason, move);
    }));
    it('should toast the move invalidity', fakeAsync(async() => {
        // Given a board where a first click was done
        await componentTestUtils.expectClickSuccess('#click_0_0');

        // When finishing an invalid move creation
        // Then the move failure reason should have been toasted
        const reason: string = DirectionFailure.DIRECTION_MUST_BE_LINEAR();
        await componentTestUtils.expectClickFailure('#click_3_4', reason);
    }));
    it('should attempt the move when doing the second click (success)', fakeAsync(async() => {
        // Given a board where a first click was done
        await componentTestUtils.expectClickSuccess('#click_2_2');

        // When cliking on a invalid second coord
        const move: MartianChessMove = MartianChessMove.from(new Coord(2, 2), new Coord(3, 3)).get();

        // Then the move should be legal and the board changed
        await componentTestUtils.expectMoveSuccess('#click_3_3', move);
    }));
    it('should highlight left coord and landing coord (empty landing coord)', fakeAsync(async() => {
        // Given a board where a move is about to be done
        await componentTestUtils.expectClickSuccess('#click_2_2');

        // When finalizing the move
        const move: MartianChessMove = MartianChessMove.from(new Coord(2, 2), new Coord(3, 3)).get();
        await componentTestUtils.expectMoveSuccess('#click_3_3', move);

        // Then left square and landing square should be highlighted
        componentTestUtils.expectElementToHaveClass('#square_2_2', 'moved');
        componentTestUtils.expectElementToHaveClass('#square_3_3', 'moved');
    }));
    it('should highlight left coord and captured coord', fakeAsync(async() => {
        // Given a board where a capture is about to be done
        const board: Table<MartianChessPiece> = [
            [C, C, B, _],
            [_, _, _, _],
            [_, _, _, _],
            [_, _, A, _],
            [_, A, _, _],
            [_, _, _, _],
            [_, _, B, A],
            [_, A, _, _],
        ];
        const state: MartianChessState = new MartianChessState(board, 1);
        componentTestUtils.setupState(state);
        await componentTestUtils.expectClickSuccess('#click_1_4');

        // When capturing
        const move: MartianChessMove = MartianChessMove.from(new Coord(1, 4), new Coord(2, 3)).get();
        await componentTestUtils.expectMoveSuccess('#click_2_3', move);

        // Then left square and landing square should be 'captured''
        componentTestUtils.expectElementToHaveClass('#square_1_4', 'moved');
        componentTestUtils.expectElementNotToHaveClass('#square_2_3', 'moved');
        componentTestUtils.expectElementToHaveClass('#square_2_3', 'captured');
    }));
    it('should highlight left coord and field promotion coord', fakeAsync(async() => {
        // Given a board where a field promotion is about to be done
        const board: Table<MartianChessPiece> = [
            [C, C, B, _],
            [_, _, _, _],
            [_, _, _, _],
            [_, _, _, _],
            [_, _, _, _],
            [_, _, _, _],
            [_, _, B, A],
            [_, A, _, _],
        ];
        const state: MartianChessState = new MartianChessState(board, 1);
        componentTestUtils.setupState(state);
        await componentTestUtils.expectClickSuccess('#click_1_7');

        // When finalizing the move
        const move: MartianChessMove = MartianChessMove.from(new Coord(1, 7), new Coord(2, 6)).get();
        await componentTestUtils.expectMoveSuccess('#click_2_6', move);

        // Then left square and landing square should be highlighted
        componentTestUtils.expectElementToHaveClass('#square_1_7', 'moved');
        componentTestUtils.expectElementToHaveClass('#square_2_6', 'moved');
        componentTestUtils.expectElementToHaveClass('#queen_2_6', 'highlighted');
    }));
    describe('clock and countdown interaction and appeareance', () => {

        it('should select the clock sign when clicking on it', fakeAsync(async() => {
            // Given a board with the clock not called yet

            // When clicking on the clock
            await componentTestUtils.expectClickSuccess('#clockOrCountDownView');

            // Then the clock circle should be highlighted
            componentTestUtils.expectElementToHaveClass('#clockOrCountDownCircle', 'highlighted');
        }));
        it('should be possible to unselect the clock when changing your mind', fakeAsync(async() => {
            // Given a board with the clock not called yet but the clock just called (locally)
            await componentTestUtils.expectClickSuccess('#clockOrCountDownView');

            // When clicking on the clock again
            await componentTestUtils.expectClickSuccess('#clockOrCountDownView');

            // Then the clock should no longer be highlighted
            componentTestUtils.expectElementNotToHaveClass('#clockOrCountDownCircle', 'highlighted');
        }));
        it('should send the move with clock call when doing it with a selected clock', fakeAsync(async() => {
            // Given a board where clock has been clicked a a piece too
            await componentTestUtils.expectClickSuccess('#clockOrCountDownView');
            await componentTestUtils.expectClickSuccess('#click_2_2');

            // When clicking on a legal landing coord for your piece
            const move: MartianChessMove = MartianChessMove.from(new Coord(2, 2), new Coord(3, 1), true).get();

            // Then a move with 'call the clock' should have been sent
            await componentTestUtils.expectMoveSuccess('#click_3_1', move);
        }));
        it('should replace the clock by the count down when calling the clock', fakeAsync(async() => {
            // Given a board where the clock is present, called, and move about to be submitted
            await componentTestUtils.expectClickSuccess('#clockOrCountDownView');
            await componentTestUtils.expectClickSuccess('#click_2_2');

            // When doing the move
            const move: MartianChessMove = MartianChessMove.from(new Coord(2, 2), new Coord(3, 1), true).get();
            await componentTestUtils.expectMoveSuccess('#click_3_1', move);

            // Then the clock should be replace by the count down (7 turn remaining)
            const countDownText: DebugElement = componentTestUtils.findElement('#countDownText');
            expect(countDownText.nativeNode.innerHTML).toEqual('7');
        }));
        it('should not select the circle when clock was called in previous turns', fakeAsync(async() => {
            // Given a board where the clock has been called in the past
            const board: Table<MartianChessPiece> = MartianChessState.getInitialState().board;
            const state: MartianChessState = new MartianChessState(board, 4, MGPOptional.empty(), MGPOptional.of(3));
            componentTestUtils.setupState(state);

            // When clicking on the circle
            await componentTestUtils.expectClickSuccess('#clockOrCountDownView');

            // Then the clock should not have been selected
            componentTestUtils.expectElementNotToHaveClass('#clockOrCountDownCircle', 'highlighted');
        }));
    });
    describe('Visual Modes', () => {
        it('should unfold "Mode Panel" when clicking on the cog', fakeAsync(async() => {
            // Given the initial board
            // When clicking on the cog
            await componentTestUtils.clickElement('#modeCog');

            // Then the modePanel should be displayed
            componentTestUtils.expectElementToExist('#modePanel');
        }));
        it('should fold "Mode Panel" when clicking again on the cog', fakeAsync(async() => {
            // Given the initial board with a clicked cog
            await componentTestUtils.clickElement('#modeCog');

            // When clicking on the cog again
            await componentTestUtils.clickElement('#modeCog');

            // Then the modePanel should not be displayed
            componentTestUtils.expectElementNotToExist('#modePanel');
        }));
        it('should test all view mode', fakeAsync(async() => {
            for (const styleAndName of componentTestUtils.getComponent().listOfStyles) {
                // Given a board in the initial mode with panel mode displayed
                await componentTestUtils.clickElement('#modeCog');

                // When clicking on the shape named like the style
                await componentTestUtils.clickElement('#' + styleAndName.name);

                // Then the mode should have been chosen
                const currentStyle: MartianChessFace = componentTestUtils.getComponent().style;
                expect(currentStyle).toBe(styleAndName.style);
            }
        }));
    });
});