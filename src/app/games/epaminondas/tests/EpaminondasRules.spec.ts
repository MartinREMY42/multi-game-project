import { NumberTable } from 'src/app/utils/ArrayUtils';
import { Direction } from 'src/app/jscaip/Direction';
import { Player } from 'src/app/jscaip/Player';
import { EpaminondasLegalityStatus } from '../epaminondaslegalitystatus';
import { EpaminondasMove } from '../EpaminondasMove';
import { EpaminondasPartSlice } from '../EpaminondasPartSlice';
import { EpaminondasRules } from '../EpaminondasRules';
import { EpaminondasMinimax } from '../EpaminondasMinimax';
import { RulesFailure } from 'src/app/jscaip/RulesFailure';

describe('EpaminondasRules:', () => {
    let rules: EpaminondasRules;
    let minimax: EpaminondasMinimax;
    const _: number = Player.NONE.value;
    const X: number = Player.ONE.value;
    const O: number = Player.ZERO.value;

    beforeEach(() => {
        rules = new EpaminondasRules(EpaminondasPartSlice);
        minimax = new EpaminondasMinimax('EpaminondasMinimax');
    });
    it('Should forbid phalanx to go outside the board (body)', () => {
        const board: NumberTable = [
            [X, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [X, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
        ];
        const slice: EpaminondasPartSlice = new EpaminondasPartSlice(board, 0);
        const move: EpaminondasMove = new EpaminondasMove(0, 11, 1, 1, Direction.DOWN);
        const status: EpaminondasLegalityStatus = rules.isLegal(move, slice);
        expect(status.legal.getReason())
            .toBe('La distance de déplacement de votre phalange la fait sortir du plateau.');
    });
    it('Should forbid phalanx to go outside the board (head)', () => {
        const board: NumberTable = [
            [X, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [X, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
        ];
        const slice: EpaminondasPartSlice = new EpaminondasPartSlice(board, 0);
        const move: EpaminondasMove = new EpaminondasMove(1, 11, 2, 2, Direction.UP_LEFT);
        const status: EpaminondasLegalityStatus = rules.isLegal(move, slice);
        expect(status.legal.getReason())
            .toBe('La distance de déplacement de votre phalange la fait sortir du plateau.');
    });
    it('Should forbid invalid phalanx (phalanx containing coord outside the board)', () => {
        const board: NumberTable = [
            [X, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [X, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
        ];
        const slice: EpaminondasPartSlice = new EpaminondasPartSlice(board, 0);
        const move: EpaminondasMove = new EpaminondasMove(0, 11, 2, 1, Direction.DOWN);
        const status: EpaminondasLegalityStatus = rules.isLegal(move, slice);
        expect(status.legal.getReason()).toBe('Cette phalange contient des pièces en dehors du plateau.');
    });
    it('Should forbid phalanx to pass through other pieces', () => {
        const board: NumberTable = [
            [X, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [_, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [X, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
        ];
        const slice: EpaminondasPartSlice = new EpaminondasPartSlice(board, 0);
        const move: EpaminondasMove = new EpaminondasMove(0, 11, 3, 3, Direction.UP);
        const status: EpaminondasLegalityStatus = rules.isLegal(move, slice);
        expect(status.legal.getReason()).toBe('Il y a quelque chose dans le chemin de votre phalange.');
    });
    it('Should forbid to capture greater phalanx', () => {
        const board: NumberTable = [
            [_, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [_, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [X, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [X, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
            [_, O, O, O, O, O, O, O, O, O, O, O, O, O],
        ];
        const slice: EpaminondasPartSlice = new EpaminondasPartSlice(board, 0);
        const move: EpaminondasMove = new EpaminondasMove(0, 10, 1, 1, Direction.UP);
        const status: EpaminondasLegalityStatus = rules.isLegal(move, slice);
        expect(status.legal.getReason())
            .toBe('Votre phalange doit être plus grande que celle qu\'elle tente de capturer.');
    });
    it('Should forbid to capture same sized phalanx', () => {
        const board: NumberTable = [
            [_, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [_, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [X, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [X, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
        ];
        const slice: EpaminondasPartSlice = new EpaminondasPartSlice(board, 0);
        const move: EpaminondasMove = new EpaminondasMove(0, 11, 2, 2, Direction.UP);
        const status: EpaminondasLegalityStatus = rules.isLegal(move, slice);
        expect(status.legal.getReason())
            .toBe('Votre phalange doit être plus grande que celle qu\'elle tente de capturer.');
    });
    it('Should forbid to capture your own pieces phalanx', () => {
        const board: NumberTable = [
            [_, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [_, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
        ];
        const slice: EpaminondasPartSlice = new EpaminondasPartSlice(board, 0);
        const move: EpaminondasMove = new EpaminondasMove(0, 11, 2, 2, Direction.UP);
        const status: EpaminondasLegalityStatus = rules.isLegal(move, slice);
        expect(status.legal.getReason()).toBe(RulesFailure.CANNOT_SELF_CAPTURE);
    });
    it('Should declare first player winner if his pawn survive one turn on last line', () => {
        const board: NumberTable = [
            [O, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [X, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
        ];
        const expectedBoard: NumberTable = [
            [O, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [X, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
        ];
        const slice: EpaminondasPartSlice = new EpaminondasPartSlice(board, 1);
        const move: EpaminondasMove = new EpaminondasMove(0, 9, 1, 1, Direction.DOWN);
        const status: EpaminondasLegalityStatus = rules.isLegal(move, slice);
        expect(status.legal.isSuccess()).toBeTrue();
        const resultingSlice: EpaminondasPartSlice = rules.applyLegalMove(move, slice, status);
        const expectedSlice: EpaminondasPartSlice = new EpaminondasPartSlice(expectedBoard, 2);
        expect(resultingSlice).toEqual(expectedSlice);
        expect(minimax.getBoardValue(move, expectedSlice).value)
            .toEqual(Number.MIN_SAFE_INTEGER, 'This should be a victory for player 0');
    });
    it('Should declare second player winner if his pawn survive one turn on first line', () => {
        const board: NumberTable = [
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [X, _, _, _, _, _, _, _, _, _, _, _, _, _],
        ];
        const expectedBoard: NumberTable = [
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [X, _, _, _, _, _, _, _, _, _, _, _, _, _],
        ];
        const slice: EpaminondasPartSlice = new EpaminondasPartSlice(board, 0);
        const move: EpaminondasMove = new EpaminondasMove(0, 2, 1, 1, Direction.UP);
        const status: EpaminondasLegalityStatus = rules.isLegal(move, slice);
        expect(status.legal.isSuccess()).toBeTrue();
        const resultingSlice: EpaminondasPartSlice = rules.applyLegalMove(move, slice, status);
        const expectedSlice: EpaminondasPartSlice = new EpaminondasPartSlice(expectedBoard, 1);
        expect(resultingSlice).toEqual(expectedSlice);
        expect(minimax.getBoardValue(move, expectedSlice).value)
            .toEqual(Number.MAX_SAFE_INTEGER, 'This should be a victory for player 1');
    });
    it('Should not consider first player winner if both player have one piece on their landing line', () => {
        const board: NumberTable = [
            [O, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [X, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
        ];
        const expectedBoard: NumberTable = [
            [O, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [X, _, _, _, _, _, _, _, _, _, _, _, _, _],
        ];
        const slice: EpaminondasPartSlice = new EpaminondasPartSlice(board, 1);
        const move: EpaminondasMove = new EpaminondasMove(0, 10, 1, 1, Direction.DOWN);
        const status: EpaminondasLegalityStatus = rules.isLegal(move, slice);
        expect(status.legal.isSuccess()).toBeTrue();
        const resultingSlice: EpaminondasPartSlice = rules.applyLegalMove(move, slice, status);
        const expectedSlice: EpaminondasPartSlice = new EpaminondasPartSlice(expectedBoard, 2);
        expect(resultingSlice).toEqual(expectedSlice);
        const boardValue: number = minimax.getBoardValue(move, expectedSlice).value;
        expect(boardValue).not.toEqual(Number.MIN_SAFE_INTEGER, 'This should not be a victory for player 0');
        expect(boardValue).not.toEqual(Number.MAX_SAFE_INTEGER, 'This should not be a victory for player 1');
    });
    it('Should forbid moving ennemy pieces', () => {
        const board: NumberTable = [
            [X, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [X, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
        ];
        const slice: EpaminondasPartSlice = new EpaminondasPartSlice(board, 1);
        const move: EpaminondasMove = new EpaminondasMove(0, 10, 1, 1, Direction.UP);
        const status: EpaminondasLegalityStatus = rules.isLegal(move, slice);
        expect(status.legal.getReason()).toBe('Une phalange ne peut pas contenir de pièces ennemies.');
    });
    it('Should allow legal move', () => {
        const board: NumberTable = [
            [X, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [X, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [X, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
        ];
        const expectedBoard: NumberTable = [
            [X, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [X, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [X, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, O, O, O, O, O, O, O, O, O, O, O, O, O],
            [_, O, O, O, O, O, O, O, O, O, O, O, O, O],
        ];
        const slice: EpaminondasPartSlice = new EpaminondasPartSlice(board, 0);
        const move: EpaminondasMove = new EpaminondasMove(0, 11, 2, 2, Direction.UP);
        const status: EpaminondasLegalityStatus = rules.isLegal(move, slice);
        expect(status.legal.isSuccess()).toBeTrue();
        const resultingSlice: EpaminondasPartSlice = rules.applyLegalMove(move, slice, status);
        const expectedSlice: EpaminondasPartSlice = new EpaminondasPartSlice(expectedBoard, 1);
        expect(resultingSlice).toEqual(expectedSlice);
    });
    it('Should allow legal capture', () => {
        const board: NumberTable = [
            [X, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [X, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [X, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [X, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
        ];
        const expectedBoard: NumberTable = [
            [X, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [X, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
            [_, O, O, O, O, O, O, O, O, O, O, O, O, O],
        ];
        const slice: EpaminondasPartSlice = new EpaminondasPartSlice(board, 0);
        const move: EpaminondasMove = new EpaminondasMove(0, 11, 3, 1, Direction.UP);
        const status: EpaminondasLegalityStatus = rules.isLegal(move, slice);
        expect(status.legal.isSuccess()).toBeTrue();
        const resultingSlice: EpaminondasPartSlice = rules.applyLegalMove(move, slice, status);
        const expectedSlice: EpaminondasPartSlice = new EpaminondasPartSlice(expectedBoard, 1);
        expect(resultingSlice).toEqual(expectedSlice);
    });
    it('Should declare first player winner when last soldier of second player has been captured');
    it('Should declare second player winner when last soldier of first player has been captured');
});
