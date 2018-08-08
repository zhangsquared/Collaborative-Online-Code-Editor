import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse} from '@angular/common/http';
import { Observable, Observer } from 'rxjs';
import { BehaviorSubject, Subscription} from 'rxjs';
import { Problem } from '../models/problem.model';
import { PROBLEMS } from '../mock-problems';
import { promise } from 'protractor';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  
  // private field start with _
  // BehaviorSubject: when subscribe, we can get the value that emiitted last time.
  // Subject: when subscribe, we can only get the value that emitted after subscribe and we cannot get value that emitted before we subscribe
  private _problemSource = new BehaviorSubject<Problem[]>([]);

  constructor(private httpClient: HttpClient) { }

  getProblems(): Observable<Problem[]> {
    this.httpClient.get('api/v1/problems')
      .toPromise()
      .then((res: any) => {
        this._problemSource.next(res);
      })
      .catch(this.handleError);
    return this._problemSource.asObservable();
  }

  getProblems2(): Observable<Problem[]> {    
    this.httpClient.get('api/v1/problems')
      .subscribe((p: any) => this._problemSource.next(p), 
      err => this.handleError(err));
    return this._problemSource.asObservable();
  }

  getProblem(id: number): Promise<Problem> {
    return this.httpClient.get(`api/v1/problems/${id}`)
      .toPromise()
      .then((res: any) => res) //same as { return res }
      .catch(this.handleError);
  }

  addProblem(problem: Problem) {
    const options = { headers: new HttpHeaders( { 'Content-Type': 'application/json' })};
    return this.httpClient.post('api/v1/problems', problem, options)
      .toPromise()
      .then((res: any) => {
        this.getProblems();
        return res;
      })
      .catch(this.handleError);
  }

  buildAndRun(data): Promise<any> {
    const options = { headers: new HttpHeaders( { 'Content-Type': 'application/json' })};
    return this.httpClient.post('api/v1/build_and_run', data, options)
      .toPromise()
      .then(res => {
        console.log("reponse from online judger: " + res);
        return res;
      })
      .catch(this.handleError);
  }

  private handleError(err: any): Promise<any> {
    console.error('an error occured', err);
    return Promise.reject(err.body || err);
  }
}