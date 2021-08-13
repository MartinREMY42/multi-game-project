import { EpaminondasMove } from 'src/app/games/epaminondas/EpaminondasMove';
import { EpaminondasPartSlice } from 'src/app/games/epaminondas/EpaminondasPartSlice';
import { Direction } from 'src/app/jscaip/Direction';
import { Player } from 'src/app/jscaip/Player';
import { MGPValidation } from 'src/app/utils/MGPValidation';
import { TutorialStep } from '../../components/wrapper-components/tutorial-game-wrapper/TutorialStep';

const _: number = Player.NONE.value;
const O: number = Player.ZERO.value;
const X: number = Player.ONE.value;
export const epaminondasTutorial: TutorialStep[] = [
    TutorialStep.informational(
        $localize`Plateau initial`,
        $localize`Ceci est le plateau de départ.
        La ligne tout en haut est la ligne de départ de Clair.
        La ligne tout en bas est la ligne de départ de Foncé.`,
        EpaminondasPartSlice.getInitialSlice(),
    ),
    TutorialStep.informational(
        $localize`But du jeu (1/2)`,
        $localize`Après plusieurs déplacements, si au début de son tour de jeu, un joueur a plus de pièces sur la ligne de départ de l'adversaire que l'adversaire n'en a sur la ligne de départ du joueur, ce joueur gagne.
        Ici, c'est au tour du joueur foncé de jouer, il a donc gagné.`,
        new EpaminondasPartSlice([
            [_, _, _, _, _, O, _, _, X, X, X, X, X, X],
            [_, _, _, _, _, O, _, _, _, _, _, _, X, X],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, X, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, O, O, O, O, _, _, _],
        ], 0),
    ),
    TutorialStep.informational(
        $localize`But du jeu (2/2)`,
        $localize`Dans ce cas ci, c'est au tour de Clair, et celui-ci gagne, car il a deux pièces sur la ligne de départ de Foncé, et Foncé n'en a qu'une sur la ligne de départ de Clair.`,
        new EpaminondasPartSlice([
            [_, _, _, _, _, O, _, _, _, _, X, X, X, X],
            [_, _, _, _, _, O, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, X, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, X, X, _, _, _, O, O, _, O, O, O, O],
        ], 1),
    ),
    TutorialStep.fromPredicate(
        $localize`Déplacement de pièce`,
        $localize`Voici le plateau de départ, c'est à Foncé de commencer.
        Commençons simplement par un déplacement d'une seule pièce :
        <ul>
            <li> 1. Cliquez sur une pièce.</li>
            <li> 2. Cliquez sur une case voisine libre.</li>
        </ul>`,
        EpaminondasPartSlice.getInitialSlice(),
        new EpaminondasMove(0, 10, 1, 1, Direction.UP),
        (move: EpaminondasMove, state: EpaminondasPartSlice) => {
            if (move.movedPieces === 1) {
                return MGPValidation.SUCCESS;
            } else {
                return MGPValidation.failure($localize`Félicitation, vous avez un pas d'avance, ce n'est malheureusement pas l'exercice.`);
            }
        },
        $localize`Voilà, c'est comme ça qu'on déplace une seule pièce.`,
    ),
    TutorialStep.fromPredicate(
        $localize`Déplacement de phalange`,
        $localize`Maintenant, comment déplacer plusieurs pièces sur une seule ligne (une phalange) :
        <ul>
            <li> 1. Cliquez sur la première pièce.</li>
            <li> 2. Cliquez sur la dernière pièce de la phalange.</li>
            <li> 3. Cliquez une des cases encadrées en jaune, elles vous permettent de déplacer au maximum votre phalange d'une distance égale à sa taille.</li>
        </ul><br/>
        Faites un déplacement de phalange!`,
        EpaminondasPartSlice.getInitialSlice(),
        new EpaminondasMove(0, 11, 2, 1, Direction.UP),
        (move: EpaminondasMove, state: EpaminondasPartSlice) => {
            if (move.movedPieces > 1) {
                return MGPValidation.SUCCESS;
            } else {
                return MGPValidation.failure($localize`Raté ! Vous n'avez bougé qu'une pièce.`);
            }
        },
        $localize`Bravo !
        Les pièces déplacées doivent être horizontalement, verticalement, ou diagonalement alignées.
        Le déplacement doit se faire le long de cette ligne, en avant ou en arrière.
        Il ne peut y avoir ni ennemis ni trous dans la phalange.`,
    ),
    TutorialStep.fromMove(
        $localize`Capture`,
        $localize`Pour capturer une phalange ennemie:
        <ul>
            <li> 1. Il faut que celle-ci soit alignée avec la phalange en déplacement.</li>
            <li> 2. Qu'elle soit strictement plus courte.</li>
            <li> 3. Que la première pièce de votre phalange atterrisse sur la première pièce rencontrée de la phalange à capturer.</li>
        </ul><br/>
        Capturez la phalange.`,
        new EpaminondasPartSlice([
            [_, _, _, _, _, _, _, _, X, X, X, X, X, X],
            [_, _, _, X, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, X, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, O, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, O, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, O, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, X, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, O, O, O, O, O, O, O],
        ], 0),
        [new EpaminondasMove(3, 7, 3, 3, Direction.UP)],
        $localize`Bravo, vous avez réussi.`,
        $localize`Raté, vous n'avez pas capturé la phalange.`,
    ),
];