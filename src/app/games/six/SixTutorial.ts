import { SixGameState } from 'src/app/games/six/SixGameState';
import { SixMove } from 'src/app/games/six/SixMove';
import { Coord } from 'src/app/jscaip/Coord';
import { Player } from 'src/app/jscaip/Player';
import { MGPValidation } from 'src/app/utils/MGPValidation';
import { DidacticialStep } from '../../components/wrapper-components/didacticial-game-wrapper/DidacticialStep';

const _: number = Player.NONE.value;
const O: number = Player.ZERO.value;
const X: number = Player.ONE.value;

export class SixDidacticialMessages {

    public static readonly MOVEMENT_NOT_DISCONNECTING: string = $localize`This move is not disconnecting a piece of your opponent. Try again with another piece.`;
}

export const sixTutorial: DidacticialStep[] = [

    DidacticialStep.informational(
        $localize`Six`,
        $localize`Six is a game without board, where pieces are placed on the side of each other, in a contiguous block.
        Every player has 21 pieces, 2 being already on the table.
        The goal of the game is to form one of the three winning shapes with your pieces.`,
        SixGameState.getInitialSlice(),
    ),
    DidacticialStep.fromMove(
        $localize`Victory (line)`,
        $localize`On this board, by putting your piece at the right place, you can align six of your pieces and win the game<br/><br/>
        Find the victory. You're playing Dark.`,
        SixGameState.fromRepresentation([
            [O, X, X, X, X, O],
            [_, O, X, _, O, _],
            [X, X, O, _, _, _],
            [_, _, O, _, _, _],
            [_, O, _, _, _, _],
            [O, _, _, _, _, _],
        ], 0),
        [SixMove.fromDrop(new Coord(3, 2))],
        $localize`Congratulations!`,
        $localize`Failed!`,
    ),
    DidacticialStep.fromMove(
        $localize`Victory (circle)`,
        $localize`On this board, by putting your piece at the right place, you can form a circle with six of your pieces and win the game.<br/><br/>
        Find the victory. You're playing Dark.`,
        SixGameState.fromRepresentation([
            [_, _, _, X, _, _],
            [_, _, X, X, O, O],
            [_, X, _, O, X, _],
            [X, O, O, O, O, X],
        ], 0),
        [SixMove.fromDrop(new Coord(5, 2))],
        $localize`Congratulations! Note that if a piece is inside the circle, it does not change anything.`,
        $localize`Failed!`,
    ),
    DidacticialStep.fromMove(
        $localize`Victory (triangle)`,
        $localize`On this board, by putting your piece at the right place, you can form a triangle with six of your pieces and win the game.<br/><br/>
        Find the victory. You're playing Dark.`,
        SixGameState.fromRepresentation([
            [_, _, _, X, _, _],
            [_, O, X, O, O, O],
            [_, O, _, O, O, _],
            [X, X, X, _, X, _],
        ], 0),
        [SixMove.fromDrop(new Coord(3, 3))],
        $localize`Congratulations!`,
        $localize`Failed!`,
    ),
    DidacticialStep.fromPredicate(
        $localize`Second phase`,
        $localize`After 40 tours, your pieces have all been placed and we move on to the second phase of the game.
        You now have to move your pieces, paying attention not to remove a piece that was blocking the opponent's victory.
        From now on, if after move, on or more pieces are disconnected from the largest group of piece, these will be taken out of the game.<br/><br/>
        You're playing Dark. Make a move that disconnects one of your opponent's pieces.`,
        SixGameState.fromRepresentation([
            [_, _, _, _, _, _, _, X, _],
            [_, _, _, _, _, _, O, _, _],
            [_, _, _, _, O, O, O, _, _],
            [_, _, _, _, X, X, _, X, O],
            [_, O, X, X, O, O, X, _, _],
            [O, O, O, O, X, X, X, _, _],
            [X, X, O, _, X, X, O, O, _],
            [_, O, _, O, O, _, _, _, _],
            [X, X, X, X, _, _, _, _, _],
            [_, O, _, _, _, _, _, _, _],
        ], 40),
        SixMove.fromDeplacement(new Coord(6, 1), new Coord(5, 1)),
        (move: SixMove, resultingState: SixGameState) => {
            if (new Coord(6, 1).equals(move.start.getOrNull()) &&
                resultingState.getPieceAt(new Coord(7, 0).getNext(resultingState.offset)) === Player.NONE)
            {
                return MGPValidation.SUCCESS;
            } else {
                return MGPValidation.failure(SixDidacticialMessages.MOVEMENT_NOT_DISCONNECTING);
            }
        },
        $localize`Congratulations, your opponent now has one piece less and you're closer to victory!`,
    ),
    DidacticialStep.fromPredicate(
        $localize`Victory by disconnection`,
        $localize`During the second phase of the game, on top of normal victories (line, circle, triangle), you can win by disconnection.
        If at any time, one player does not have enough pieces to win (less than 6), the game ends.
        The one with the most pieces wins. In case of tie, it's a draw.<br/><br/>
        Here, you're playing Dark and you can win. Do it!`,
        SixGameState.fromRepresentation([
            [_, _, _, _, _, X],
            [_, _, _, _, O, X],
            [_, _, _, X, O, O],
            [_, _, O, _, X, O],
            [X, X, _, _, _, O],
            [O, X, _, _, _, _],
            [O, _, _, _, _, _],
        ], 40),
        SixMove.fromDeplacement(new Coord(2, 3), new Coord(3, 3)),
        (move: SixMove, _resultingState: SixGameState) => {
            if (new Coord(2, 3).equals(move.start.getOrNull())) {
                return MGPValidation.SUCCESS;
            } else {
                return MGPValidation.failure($localize`This move does not disconnect your opponent's pieces. Try again with another piece.`);
            }
        },
        $localize`Congratulations, you won!`,
    ),
    DidacticialStep.fromPredicate(
        $localize`Special disconnection`,
        $localize`During a disconnection, two or more groups could have the same size,
        in which case you will have to click on the group you wish to keep.<br/><br/>
        You're playing Dark, play such a move!`,
        SixGameState.fromRepresentation([
            [_, _, _, _, _, X],
            [_, _, _, _, O, X],
            [_, _, _, X, O, O],
            [O, _, O, _, _, X],
            [X, X, _, _, _, _],
            [O, O, _, _, _, _],
            [O, _, _, _, _, _],
        ], 40),
        SixMove.fromCut(new Coord(2, 3), new Coord(2, 5), new Coord(2, 5)),
        (move: SixMove, resultingState: SixGameState) => {
            if (move.keep.isAbsent()) {
                return MGPValidation.failure($localize`This move has not cut the board in two equal halves.`);
            }
            if (resultingState.getPieceAt(move.landing.getNext(resultingState.offset)) === Player.NONE) {
                return MGPValidation.failure(`Failed. You did cut the board in two but you kept the half where you're in minority. Therefore, you lost! Try again.`);
            } else {
                return MGPValidation.SUCCESS;
            }
        },
        $localize`Congratulations, you won!`,
    ),
];