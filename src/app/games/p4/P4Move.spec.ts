import { P4Move } from './P4Move';

describe('P4Move', () => {
    describe('of', () => {
        it('should return the same instance every time', () => {
            expect(P4Move.of(3)).toBe(P4Move.of(3));
        });
        it('should fail on invalid move values', () => {
            expect(() => P4Move.of(7)).toThrow();
            expect(() => P4Move.of(42)).toThrow();
        });
        it('should assign the correct x property', () => {
            for (let i: number = 0; i < 7; i++) {
                expect(P4Move.of(i).x).toBe(i);
            }
        });
    });
    describe('equals', () => {
        it('should consider identical move equal', () => {
            const move: P4Move = P4Move.of(5);
            expect(move.equals(move)).toBeTrue();
        });
        it('should consider different moves non equal', () => {
            const move1: P4Move = P4Move.of(5);
            const move2: P4Move = P4Move.of(6);
            expect(move1.equals(move2)).toBeFalse();
        });
    });
    describe('encode and decode', () => {
        it('should be inverse of each other', () => {
            for (let i: number = 0; i < 7; i++) {
                const move: P4Move = P4Move.of(i);
                expect(P4Move.decode(move.encode())).toBe(move);
            }
        });
    });
    describe('decode method', () => {
        it('should delegate decoding to static method', () => {
            const move: P4Move = P4Move.of(2);
            spyOn(P4Move, 'decode').and.callThrough();
            move.decode(5);
            expect(P4Move.decode).toHaveBeenCalledTimes(1);
        });
    });
    describe('toString', () => {
        it('should contain information on the column', () => {
            const move: P4Move = P4Move.of(1);
            expect(move.toString()).toBe('P4Move(1)');
        });
    });
});
