import { Coord } from 'src/app/jscaip/Coord';
import { MGPNode } from 'src/app/jscaip/MGPNode';
import { MGPOptional } from 'src/app/utils/MGPOptional';
import { KamisadoColor } from '../KamisadoColor';
import { KamisadoMinimax } from '../KamisadoMinimax';
import { KamisadoMove } from '../KamisadoMove';
import { KamisadoPartSlice } from '../KamisadoPartSlice';
import { KamisadoPiece } from '../KamisadoPiece';
import { KamisadoNode, KamisadoRules } from '../KamisadoRules';

describe('KamisadoMinimax', () => {

    let rules: KamisadoRules;
    let minimax: KamisadoMinimax;

    const _: number = KamisadoPiece.NONE.getValue();
    const R: number = KamisadoPiece.ZERO.RED.getValue();
    const b: number = KamisadoPiece.ONE.BROWN.getValue();

    beforeEach(() => {
        rules = new KamisadoRules(KamisadoPartSlice);
        minimax = new KamisadoMinimax(rules, 'KamisadoMinimax');
    });
    it('should provide 102 possible moves at turn 0', () => {
        // Each piece on the side can do 6 vertical moves and 6 diagonal ones = 12 moves per piece * 2 side pieces
        // Other pieces  can do 6 vertical and 7 diagonal = 13 moves per piece * 6 pieces
        // In total, that makes 102 possible moves
        const firstTurnMoves: KamisadoMove[] = minimax.getListMoves(rules.node);
        expect(firstTurnMoves.length).toEqual(102);
    });
    it('should assign board values based on positions', () => {
        const board: number[][] = [
            [_, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _],
            [b, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _],
            [R, _, _, _, _, _, _, _],
        ];
        const slice: KamisadoPartSlice =
            new KamisadoPartSlice(6, KamisadoColor.RED, MGPOptional.of(new Coord(0, 7)), false, board);
        const node: KamisadoNode = new MGPNode(null, null, slice);
        expect(minimax.getBoardValue(node).value).toEqual(2);
    });
});