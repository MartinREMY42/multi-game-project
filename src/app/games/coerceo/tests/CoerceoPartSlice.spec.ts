import { Coord } from 'src/app/jscaip/Coord';
import { Player } from 'src/app/jscaip/Player';
import { Table } from 'src/app/utils/ArrayUtils';
import { CoerceoPartSlice, CoerceoPiece } from '../CoerceoPartSlice';

describe('CoerceoPartSlice', () => {
    describe('CoerceoPiece', () => {
        describe('playerOf', () => {
            it('Should throw when called with anything else than Player.ONE or Player.ZERO', () => {
                expect(() => CoerceoPiece.ofPlayer(Player.NONE))
                    .toThrowError('CoerceoPiece.ofPlayer can only be called with Player.ZERO and Player.ONE.');
            });
        });
    });
    describe('isDeconnectable', () => {
        it('Should not deconnect tile with more than 3 neighboor (v _ _ v v v)', () => {
            const slice: CoerceoPartSlice = new CoerceoPartSlice([], 0, [0, 0], [0, 0]);
            spyOn(slice, 'getPresentNeighboorTilesRelativeIndexes').and.returnValue([0, 1, 2, 3, 4, 5]);
            expect(slice.isDeconnectable(null)).toBeFalse();
        });
        it('Should deconnect when 3 adjacent neighboor (v v v _ _ _ )', () => {
            const slice: CoerceoPartSlice = new CoerceoPartSlice([], 0, [0, 0], [0, 0]);
            spyOn(slice, 'getPresentNeighboorTilesRelativeIndexes').and.returnValue([0, 1, 2]);
            expect(slice.isDeconnectable(null)).toBeTrue();
        });
        it('Should not deconnect when 3 splitted neighboor (v v _ v _ _)', () => {
            const slice: CoerceoPartSlice = new CoerceoPartSlice([], 0, [0, 0], [0, 0]);
            spyOn(slice, 'getPresentNeighboorTilesRelativeIndexes').and.returnValue([0, 1, 3]);
            expect(slice.isDeconnectable(null)).toBeFalse();
        });
        it('Should not deconnect when 3 splitted neighboor (v _ v v _ _)', () => {
            const slice: CoerceoPartSlice = new CoerceoPartSlice([], 0, [0, 0], [0, 0]);
            spyOn(slice, 'getPresentNeighboorTilesRelativeIndexes').and.returnValue([0, 2, 3]);
            expect(slice.isDeconnectable(null)).toBeFalse();
        });
        it('Should deconnect when 2 adjacent neighboor (v v _ _ _ _)', () => {
            const slice: CoerceoPartSlice = new CoerceoPartSlice([], 0, [0, 0], [0, 0]);
            spyOn(slice, 'getPresentNeighboorTilesRelativeIndexes').and.returnValue([0, 1]);
            expect(slice.isDeconnectable(null)).toBeTrue();
        });
        it('Should deconnect when 2 adjacent neighboor (v _ _ _ _ v)', () => {
            const slice: CoerceoPartSlice = new CoerceoPartSlice([], 0, [0, 0], [0, 0]);
            spyOn(slice, 'getPresentNeighboorTilesRelativeIndexes').and.returnValue([0, 5]);
            expect(slice.isDeconnectable(null)).toBeTrue();
        });
        it('Should not deconnect when 2 non adjacent neighboor (v _ v _ _ _)', () => {
            const slice: CoerceoPartSlice = new CoerceoPartSlice([], 0, [0, 0], [0, 0]);
            spyOn(slice, 'getPresentNeighboorTilesRelativeIndexes').and.returnValue([0, 2]);
            expect(slice.isDeconnectable(null)).toBeFalse();
        });
        it('Should deconnect when only one neighboor', () => {
            const slice: CoerceoPartSlice = new CoerceoPartSlice([], 0, [0, 0], [0, 0]);
            spyOn(slice, 'getPresentNeighboorTilesRelativeIndexes').and.returnValue([0]);
            expect(slice.isDeconnectable(null)).toBeTrue();
        });
    });
    it('getTilesUpperLeftCoord should assign correct value', () => {
        const A: Coord = new Coord(0, 0);
        const B: Coord = new Coord(3, -1);
        const C: Coord = new Coord(0, 2);
        const D: Coord = new Coord(3, 1);
        const coords: Table<Coord> = [
            [A, A, A, B, B, B],
            [A, A, A, D, D, D],
            [C, C, C, D, D, D],
        ];
        for (let y: number = 0; y < 3; y++) {
            for (let x: number = 0; x < 6; x++) {
                const expectedCoord: Coord = coords[y][x];
                const actualCoord: Coord = CoerceoPartSlice.getTilesUpperLeftCoord(new Coord(x, y));
                expect(actualCoord).toEqual(expectedCoord);
            }
        }
    });
});
