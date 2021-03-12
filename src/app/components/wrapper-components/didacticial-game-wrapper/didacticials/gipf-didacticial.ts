import { GipfCapture, GipfMove, GipfPlacement } from 'src/app/games/gipf/gipf-move/GipfMove';
import { GipfPartSlice } from 'src/app/games/gipf/gipf-part-slice/GipfPartSlice';
import { GipfPiece } from 'src/app/games/gipf/gipf-piece/GipfPiece';
import { Coord } from 'src/app/jscaip/coord/Coord';
import { HexaBoard } from 'src/app/jscaip/hexa/HexaBoard';
import { HexaDirection } from 'src/app/jscaip/hexa/HexaDirection';
import { MGPOptional } from 'src/app/utils/mgp-optional/MGPOptional';
import { DidacticialStep } from '../DidacticialStep';

const _: GipfPiece = GipfPiece.EMPTY;
const O: GipfPiece = GipfPiece.PLAYER_ZERO;
const X: GipfPiece = GipfPiece.PLAYER_ONE;
export const gipfDidacticial: DidacticialStep[] = [
    DidacticialStep.informational(
        'But du jeu',
        `Le but du jeu est de capturer les pièces de l'adversaire afin qu'il ne puisse plus jouer.
         Voici la configuration initiale du plateau.
         Chaque joueur a 12 pièces en réserve et 3 sur le plateau.
         Dès qu'à son tour, un joueur n'a plus de pièces dans sa réserve, il ne sait pas jouer, et perd.
         Le premier joueur possède les pièces foncées, le deuxième les pièces claires.`,
        GipfPartSlice.getInitialSlice(),
    ),
    DidacticialStep.anyMove(
        'Insertion',
        `Tout les tours contiennent une insertion:
         1. Cliquez sur la case où vous voulez insérer votre pièce.
         2. Cliquez sur la flèche représentant la direction dans laquelle pousser les éventuelles pièces déjà présentes dans la rangée.
         Une insertion est interdite dans une rangée complète.
         Vous jouez Foncé, insérez une pièce.`,
        GipfPartSlice.getInitialSlice(),
        'Bravo.',
    ),
    DidacticialStep.forMove(
        'Capture (1/3)',
        `Pour faire une capture, il faut aligner 4 de ses pièces.
         Il y a plusieurs choses à savoir sur une capture :
         1. Quand 4 pièces sont capturées, toutes les pièces directement alignées avec ces 4 pièces le sont également.
         2. Dès qu'un espace le long de cette ligne est rencontré, la capture s'arrête.
         3. Vos pièces capturées rejoignent votre réserve.
         Celles de l'adversaire par contre sont réellement capturées et ne rejoignent pas sa réserve.
         4. Si vous créez une ligne de 4 pièces de l'adversaire, c'est au début de son tour qu'il pourra les capturer.
         Ceci implique que votre tour se passe en trois phases :
         A. Choisir la/les capture(s) crée(s) par le dernier mouvement de votre adversaire.
         B. Faire votre insertion.
         C. Choisir la/les ligne(s) à capturer que vous venez de créer.
         Vous jouez Foncé, une capture est faisable, faites là.`,
        new GipfPartSlice(HexaBoard.fromTable([
            [_, _, _, O, X, _, _],
            [_, _, _, _, _, _, _],
            [_, _, _, _, _, _, _],
            [O, O, O, _, _, _, _],
            [X, _, _, _, _, _, _],
            [_, _, _, X, _, _, _],
            [_, _, _, X, _, _, _],
        ], GipfPiece.EMPTY, GipfPiece.encoder), 42, [8, 8], [0, 0]),
        [new GipfMove(
            new GipfPlacement(new Coord(-3, 0), MGPOptional.of(HexaDirection.DOWN_RIGHT)),
            [],
            [new GipfCapture([
                new Coord(-3, 0),
                new Coord(-2, 0),
                new Coord(-1, 0),
                new Coord(0, 0),
            ])],
        )],
        `Bravo, vous avez récupéré 4 de vos pièces, mais ce n'est pas la capture la plus utile.
         Voyons maintenant la vraie utilité d'une capture.`,
        'Raté.',
    ),
    DidacticialStep.forMove(
        'Capture (2/3)',
        `Ici, il est possible de capturer de trois façons différentes.
         L'une ne permet aucune capture de pièce adverse.
         L'autre permet une capture de pièce adverse.
         La dernière en permet deux, choisissez cette dernière.`,
        new GipfPartSlice(HexaBoard.fromTable([
            [_, _, _, _, _, _, _],
            [_, _, _, X, _, _, _],
            [_, _, _, O, _, _, _],
            [O, O, O, X, _, _, _],
            [_, _, _, O, _, _, _],
            [_, _, _, O, _, _, _],
            [_, _, _, X, _, _, _],
        ], GipfPiece.EMPTY, GipfPiece.encoder), 42, [8, 4], [2, 3]),
        [new GipfMove(
            new GipfPlacement(new Coord(-3, 0), MGPOptional.of(HexaDirection.DOWN_RIGHT)),
            [],
            [new GipfCapture([
                new Coord(0, -2),
                new Coord(0, -1),
                new Coord(0, 0),
                new Coord(0, 1),
                new Coord(0, 2),
                new Coord(0, 3),
            ])],
        )],
        `Bravo, vous avez récupéré 4 de vos pièces et capturé 2 pièces de l'adversaire.
         Le maximum possible étant 3 par captures.`,
        'Raté, la capture optimale capture 2 pièces adverses.',
    ),
    DidacticialStep.forMove(
        'Capture (3/3)',
        `Ici, vous aurez une capture à faire au début de votre tour.
         Elle a été provoqué par un mouvement de votre adversaire lors de son tour de jeu
         (bien que ce plateau soit fictif à des fins pédagogiques).
         Et après le bon mouvement, vous pourrez faire deux captures différentes!
         Gardez à l'esprit que le plus utile d'une capture, est de capturer les pièces ennemies!`,
        new GipfPartSlice(HexaBoard.fromTable([
            [_, _, _, O, _, _, O],
            [_, _, _, O, _, _, O],
            [_, O, O, _, O, X, O],
            [_, _, _, O, _, _, O],
            [_, _, _, O, _, _, _],
            [O, O, O, X, X, _, _],
            [_, _, _, O, _, _, _],
        ], GipfPiece.EMPTY, GipfPiece.encoder), 42, [8, 4], [2, 3]),
        [
            new GipfMove(
                new GipfPlacement(new Coord(0, 3), MGPOptional.of(HexaDirection.UP)),
                [new GipfCapture([
                    new Coord(3, -3),
                    new Coord(3, -2),
                    new Coord(3, -1),
                    new Coord(3, 0),
                ])],
                [
                    new GipfCapture([
                        new Coord(-3, 2),
                        new Coord(-2, 2),
                        new Coord(-1, 2),
                        new Coord(0, 2),
                        new Coord(1, 2),
                    ]),
                    new GipfCapture([
                        new Coord(-2, -1),
                        new Coord(-1, -1),
                        new Coord(0, -1),
                        new Coord(1, -1),
                        new Coord(2, -1),
                    ]),
                ],
            ),
            new GipfMove(
                new GipfPlacement(new Coord(0, 3), MGPOptional.of(HexaDirection.UP)),
                [new GipfCapture([
                    new Coord(3, -3),
                    new Coord(3, -2),
                    new Coord(3, -1),
                    new Coord(3, 0),
                ])],
                [
                    new GipfCapture([
                        new Coord(-3, 2),
                        new Coord(-2, 2),
                        new Coord(-1, 2),
                        new Coord(0, 2),
                        new Coord(1, 2),
                    ]),
                    new GipfCapture([
                        new Coord(0, -3),
                        new Coord(0, -2),
                        new Coord(0, -1),
                        new Coord(0, 0),
                        new Coord(0, 1),
                    ]),
                ],
            ),
        ],
        `Bravo, vous avez récupéré 4 de vos pièces et capturé 2 pièces de l'adversaire.
         Le maximum possible étant 3 par captures.`,
        'Raté, la capture optimale capture 2 pièces adverses.',
    ),
];