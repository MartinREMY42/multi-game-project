import { Move } from '../../../jscaip/Move';
import { LegalityStatus } from 'src/app/jscaip/LegalityStatus';
import { Component } from '@angular/core';
import { RectangularGameState } from 'src/app/jscaip/RectangularGameState';
import { AbstractGameComponent } from '../abstract-game-component/AbstractGameComponent';
import { Table } from 'src/app/utils/ArrayUtils';

/* All method are to be implemented by the concretes game component
 * Except chooseMove which must be set by the GameWrapper
 * (since OnlineGameWrapper and LocalGameWrapper will not give the same action to do when a move is done)
 */
@Component({
    template: '',
})
export abstract class RectangularGameComponent<M extends Move,
                                               S extends RectangularGameState<P>,
                                               P,
                                               L extends LegalityStatus = LegalityStatus>
    extends AbstractGameComponent<M, S, L>
{

    public board: Table<P>;
}
