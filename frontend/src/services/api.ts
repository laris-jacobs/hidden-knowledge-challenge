import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Action, Item, Payload} from '../models/input.model';

@Injectable({
  providedIn: 'root'
})
export class Api {
  public static API_URL = 'http://74.161.161.50:8080/';

  public http = inject(HttpClient);

  public getAction(): Observable<Action[]> {

    return this.http.get<Action[]>(Api.API_URL + 'action');
  }
  public getItems(): Observable<Item[]>{
    return this.http.get<Item[]>(Api.API_URL + 'item');
  }

  public requestInformation(payload: Payload): Observable<Action[]>{

    return this.http.post<Action[]>(Api.API_URL +'', payload)
  }
}
