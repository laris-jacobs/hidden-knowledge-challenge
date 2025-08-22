import {Component, signal} from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  protected readonly title = signal('hiddenKnowledge');
}
