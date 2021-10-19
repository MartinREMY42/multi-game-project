import { AwaleNode, AwaleRules } from '../AwaleRules';
import { AwaleMinimax } from '../AwaleMinimax';
import { AwaleMove } from '../AwaleMove';
import { AwaleState } from '../AwaleState';
import { MGPNode } from 'src/app/jscaip/MGPNode';

describe('AwaleMinimax:', () => {

    let rules: AwaleRules;

    let minimax: AwaleMinimax;

    beforeEach(() => {
        rules = new AwaleRules(AwaleState);
        minimax = new AwaleMinimax(rules, 'AwaleMinimax');
    });
    it('should not throw at first choice', () => {
        const bestMove: AwaleMove = rules.node.findBestMove(2, minimax);
        expect(rules.isLegal(bestMove, rules.node.gameState).legal.isSuccess()).toBeTrue();
    });
    it('should choose capture when possible (at depth 1)', () => {
        const board: number[][] = [
            [4, 4, 4, 4, 4, 4],
            [4, 4, 4, 4, 4, 1],
        ];
        const state: AwaleState = new AwaleState(board, 0, [0, 0]);
        const node: MGPNode<AwaleRules, AwaleMove, AwaleState> = new MGPNode(null, null, state);
        const bestMove: AwaleMove = node.findBestMove(1, minimax);
        expect(bestMove).toEqual(AwaleMove.TWO);
    });
    it('should choose capture when possible (at depth 2)', () => {
        const board: number[][] = [
            [0, 0, 0, 0, 3, 1],
            [0, 0, 0, 0, 1, 0],
        ];
        const state: AwaleState = new AwaleState(board, 0, [0, 0]);
        const node: MGPNode<AwaleRules, AwaleMove, AwaleState> = new MGPNode(null, null, state);
        const bestMove: AwaleMove = node.findBestMove(2, minimax);
        expect(bestMove).toEqual(AwaleMove.FOUR);
    });
    it('should not include illegal move', () => {
        // Given a board with valid illegal moves
        const board: number[][] = [
            [5, 1, 1, 1, 1, 1],
            [0, 0, 0, 0, 0, 0],
        ];
        const state: AwaleState = new AwaleState(board, 0, [0, 0]);
        const node: AwaleNode = new MGPNode(null, null, state);

        // when asking list moves
        const moves: AwaleMove[] = minimax.getListMoves(node);

        // then length should be one and move be the only legal
        expect(moves.length).toEqual(1);
        expect(moves[0]).toBe(AwaleMove.FIVE);
    });
});

