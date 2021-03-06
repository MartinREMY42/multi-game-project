import { Pipe, PipeTransform } from '@angular/core';

export type Duration = number

@Pipe({ name: 'humanDuration' })
export class HumanDuration implements PipeTransform {
    public transform(duration: Duration): string {
        const seconds: number = duration % 60;
        const minutes: number = ((duration - seconds) % 3600) / 60;
        const hours: number = (duration - (minutes * 60) - seconds) / 3600;
        const text: string[] = [];
        if (hours > 1) {
            text.push(`${ hours } heures`);
        } else if (hours === 1) {
            text.push('1 heure');
        }
        if (minutes > 1) {
            text.push(`${ minutes } minutes`);
        } else if (minutes === 1) {
            text.push('1 minute');
        }
        if (seconds > 1) {
            text.push(`${ seconds } secondes`);
        } else if (seconds === 1) {
            text.push('1 seconde');
        }
        if (text.length === 0) {
            return '0 secondes';
        } else if (text.length === 1) {
            return text[0];
        } else {
            return text.slice(0, -1).join(', ') + ' et ' + text.slice(-1);
        }
    }
}
