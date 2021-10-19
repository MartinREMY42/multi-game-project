import { fakeAsync } from '@angular/core/testing';
import { P4Component } from '../p4.component';
import { P4Move } from 'src/app/games/p4/P4Move';
import { ComponentTestUtils } from 'src/app/utils/tests/TestUtils.spec';
import { Player } from 'src/app/jscaip/Player';
import { P4State } from '../P4State';
import { Table } from 'src/app/utils/ArrayUtils';

describe('P4Component', () => {

    let componentTestUtils: ComponentTestUtils<P4Component>;

    const O: Player = Player.ZERO;
    const _: Player = Player.NONE;

    beforeEach(fakeAsync(async() => {
        componentTestUtils = await ComponentTestUtils.forGame<P4Component>('P4');
    }));
    it('should create', () => {
        expect(componentTestUtils.wrapper).toBeTruthy('Wrapper should be created');
        expect(componentTestUtils.getComponent()).toBeTruthy('Component should be created');
    });
    it('should accept and highlight simple move', fakeAsync(async() => {
        const move: P4Move = P4Move.THREE;
        await componentTestUtils.expectMoveSuccess('#click_3', move);
        componentTestUtils.expectElementToExist('#last_3_5');
    }));
    it('should highlight victory', fakeAsync(async() => {
        const board: Table<Player> = [
            [_, _, _, _, _, _, _],
            [_, _, _, _, _, _, _],
            [_, _, _, O, _, _, _],
            [_, _, _, O, _, _, _],
            [_, _, _, O, _, _, _],
            [_, _, _, O, _, _, _],
        ];
        const state: P4State = new P4State(board, 0);
        componentTestUtils.setupState(state);
        componentTestUtils.expectElementToHaveClass('#victory_3_3', 'victory-stroke');
    }));
});
