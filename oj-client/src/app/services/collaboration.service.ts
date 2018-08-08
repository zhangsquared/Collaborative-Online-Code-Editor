import { Injectable } from '@angular/core';
declare var io: any; // io is already imported in Angualr.cli.json

@Injectable({
  providedIn: 'root'
})
export class CollaborationService {
  collaborationSocket: any;
  constructor() { }

  init(editor: any, sessionId: string): void {
    // window.location.origin -- the server location on the current page
    // e.g. the curren tpage on the brower is "localhost:3000/problems/1", the origin is "localhost:3000"
    this.collaborationSocket = io(window.location.origin, { query: 'sessionId=' + sessionId});
    // wait for 'message' event
    // when receive the message, for now just print
    this.collaborationSocket.on("message", (message) => {
      console.log('recived form server: ' + message);
    });

    this.collaborationSocket.on("change", (delta: string) => {
      console.log('collobration: editor chagned by ' + delta);
      delta = JSON.parse(delta);
      editor.lastAppliedChanged = delta;
      editor.getSession().getDocument().applyDeltas([delta]); // ace API
    });
  }

  change(delta: string): void {
    this.collaborationSocket.emit("change", delta);
  }

  restoreBuffer() : void {
    this.collaborationSocket.emit("restoreBuffer");
  }

}
