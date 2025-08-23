import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Item} from '../models/input.model';

@Injectable({
  providedIn: 'root'
})
export class Api {

  public http = inject(HttpClient);

  public getAction(): Observable<Item[]> {

    return this.http.get<Item[]>('http://74.161.161.50:8080/action');
  }
}
