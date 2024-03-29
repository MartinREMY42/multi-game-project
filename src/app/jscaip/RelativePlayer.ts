export class RelativePlayer {

    public static readonly NONE: RelativePlayer = new RelativePlayer('NONE');

    public static readonly OPPONENT: RelativePlayer = new RelativePlayer('OPPONENT');

    public static readonly PLAYER: RelativePlayer = new RelativePlayer('PLAYER');

    private constructor(public readonly value: string) {}
}
