import { Direction } from 'src/app/jscaip/Direction';
import { EpaminondasState } from '../DraughtsState';
import { DraughtsRules } from '../DraughtsRules';
import { DraughtsMinimax } from '../DraughtsMinimax';
import { DraughtsMove } from '../DraughtsMove';
import { NumberEncoderTestUtils } from 'src/app/jscaip/tests/Encoder.spec';

describe('DraughtsMove: ', () => {

    it('Should forbid null values', () => {
        expect(() => new DraughtsMove(null, 1, 1, 1, Direction.UP)).toThrowError('X cannot be null.');
        expect(() => new DraughtsMove(1, null, 1, 1, Direction.UP)).toThrowError('Y cannot be null.');
        expect(() => new DraughtsMove(1, 1, null, 1, Direction.UP))
            .toThrowError('Number of moved pieces cannot be null.');
        expect(() => new DraughtsMove(1, 1, 1, null, Direction.UP)).toThrowError('Step size cannot be null.');
        expect(() => new DraughtsMove(1, 1, 1, 1, null)).toThrowError('Direction cannot be null.');
    });
    it('Should forbid out of range coords', () => {
        expect(() => new DraughtsMove(-1, 0, 1, 1, Direction.DOWN_LEFT))
            .toThrowError('Illegal coord outside of board (-1, 0).');
        expect(() => new DraughtsMove(0, 13, 1, 1, Direction.UP_RIGHT))
            .toThrowError('Illegal coord outside of board (0, 13).');
    });
    it('Should forbid invalid step size and number of selected piece', () => {
        expect(() => new DraughtsMove(0, 0, 2, 3, Direction.UP))
            .toThrowError('Cannot move a phalanx further than its size (got step size 3 for 2 pieces).');
        expect(() => new DraughtsMove(0, 0, -1, 0, Direction.UP))
            .toThrowError('Must select minimum one piece (got -1).');
        expect(() => new DraughtsMove(2, 2, 1, 0, Direction.UP))
            .toThrowError('Step size must be minimum one (got 0).');
    });
    it('DraughtsMove.encoder should be correct', () => {
        const rules: DraughtsRules = new DraughtsRules(EpaminondasState);
        const minimax: DraughtsMinimax = new DraughtsMinimax(rules, 'EpaminondasMinimax');
        const moves: DraughtsMove[] = minimax.getListMoves(rules.node);
        for (const move of moves) {
            NumberEncoderTestUtils.expectToBeCorrect(DraughtsMove.encoder, move);
        }
    });
    it('Should forbid non integer number to decode', () => {
        expect(() => DraughtsMove.encoder.decode(0.5)).toThrowError('EncodedMove must be an integer.');
    });
    it('Should override correctly equals and toString', () => {
        const move: DraughtsMove = new DraughtsMove(4, 3, 2, 1, Direction.UP);
        const neighboor: DraughtsMove = new DraughtsMove(0, 0, 2, 1, Direction.UP);
        const twin: DraughtsMove = new DraughtsMove(4, 3, 2, 1, Direction.UP);
        const firstCousin: DraughtsMove = new DraughtsMove(4, 3, 1, 1, Direction.UP);
        const secondCousin: DraughtsMove = new DraughtsMove(4, 3, 2, 2, Direction.UP);
        const thirdCousin: DraughtsMove = new DraughtsMove(4, 3, 2, 1, Direction.LEFT);
        expect(move.equals(move)).toBeTrue();
        expect(move.equals(neighboor)).toBeFalse();
        expect(move.equals(firstCousin)).toBeFalse();
        expect(move.equals(secondCousin)).toBeFalse();
        expect(move.equals(thirdCousin)).toBeFalse();
        expect(move.equals(twin)).toBeTrue();
        expect(move.toString()).toBe('DraughtsMove((4, 3), m:2, s:1, UP)');
    });
});
