import { Coord } from 'src/app/jscaip/coord/Coord';
import { JSONValue } from 'src/app/utils/collection-lib/utils';
import { MGPMap } from 'src/app/utils/mgp-map/MGPMap';
import { SixGameState } from '../six-game-state/SixGameState';
import { SixRules } from '../six-rules/SixRules';
import { SixMove } from './SixMove';

describe('SixMove', () => {
    it('Should allow dropping', () => {
        const move: SixMove = SixMove.fromDrop(new Coord(0, 0));
        expect(move).toBeTruthy();
    });
    it('Should allow move without mentionned "keep"', () => {
        const move: SixMove = SixMove.fromDeplacement(new Coord(0, 0), new Coord(1, 1));
        expect(move).toBeTruthy();
    });
    it('Should throw when creating static deplacement', () => {
        const error: string = 'Deplacement cannot be static!';
        expect(() => SixMove.fromDeplacement(new Coord(0, 0), new Coord(0, 0))).toThrowError(error);
    });
    it('Should allow move with mentionned "keep"', () => {
        const move: SixMove = SixMove.fromCuttingDeplacement(new Coord(0, 0), new Coord(2, 2), new Coord(1, 1));
        expect(move).toBeTruthy();
    });
    it('Should throw when creating deplacement keeping starting coord', () => {
        const error: string = 'Cannot keep starting coord, since it will always be empty after move!';
        expect(() => SixMove.fromCuttingDeplacement(new Coord(0, 0), new Coord(1, 1), new Coord(0, 0)))
            .toThrowError(error);
    });
    describe('Overrides', () => {
        it('should have functionnal equals', () => {
            const drop: SixMove = SixMove.fromDrop(new Coord(0, 0));
            const otherDrop: SixMove = SixMove.fromDrop(new Coord(1, 1));
            const deplacement: SixMove = SixMove.fromDeplacement(new Coord(1, 1), new Coord(0, 0));
            const cuttingDeplacement: SixMove =
                SixMove.fromCuttingDeplacement(new Coord(1, 1), new Coord(0, 0), new Coord(2, 2));
            expect(drop.equals(null)).toBeFalse();
            expect(drop.equals(otherDrop)).toBeFalse();
            expect(drop.equals(deplacement)).toBeFalse();
            expect(deplacement.equals(cuttingDeplacement)).toBeFalse();
        });
        it('Should forbid non object to decode', () => {
            expect(() => SixMove.encoder.decode(0.5)).toThrowError('Invalid encodedMove of type number!');
        });
        it('should delegate decoding to static method', () => {
            const testMove: SixMove =
                SixMove.fromCuttingDeplacement(new Coord(1, 1), new Coord(0, 0), new Coord(2, 2));
            spyOn(SixMove.encoder, 'decode').and.callThrough();
            testMove.decode(testMove.encode());
            expect(SixMove.encoder.decode).toHaveBeenCalledTimes(1);
        });
        it('should stringify nicely', () => {
            const drop: SixMove = SixMove.fromDrop(new Coord(5, 5));
            const deplacement: SixMove = SixMove.fromDeplacement(new Coord(5, 5), new Coord(7, 5));
            const cuttingDeplacement: SixMove =
                SixMove.fromCuttingDeplacement(new Coord(5, 5), new Coord(7, 5), new Coord(9, 9));
            expect(drop.toString()).toEqual('SixMove((5, 5))');
            expect(deplacement.toString()).toEqual('SixMove((5, 5) > (7, 5))');
            expect(cuttingDeplacement.toString()).toEqual('SixMove((5, 5) > (7, 5), keep: (9, 9))');
        });
        it('SixMove.encode and SixMove.decode should be reversible', () => {
            const rules: SixRules = new SixRules(SixGameState);
            const moves: MGPMap<SixMove, SixGameState> = rules.getListMoves(rules.node);
            for (let i: number = 0; i < moves.size(); i++) {
                const move: SixMove = moves.getByIndex(i).key;
                const encodedMove: JSONValue = SixMove.encoder.encode(move);
                const decodedMove: SixMove = SixMove.encoder.decode(encodedMove);
                expect(decodedMove).toEqual(move);
            }
        });
    });
});
