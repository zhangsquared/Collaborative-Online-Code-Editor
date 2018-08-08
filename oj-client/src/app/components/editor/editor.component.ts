import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CollaborationService } from '../../services/collaboration.service';
import { DataService } from '../../services/data.service';

declare var ace: any; // since ace is not written by typescript, we declare ace as 'any' type

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnInit {

  editor: any;
  defaultContent = {
  	'Java': `public class Example {
  		public static void main(String[] args) {
  			// Type your Java code here
  		}
  	}`,
  	'Python': `class Solution:
  		def example():
  			# Write your Python code here
  	`,
    'C++': `#include <iostream>
      using namespace std;
      int main() 
      {
          // Write your C++ code here
      }`
  };
  languages: string[] = ['Java', 'Python', 'C++'];
  language: string = 'Java';
  sessionId: string;
  output: string = ''; // to store output from buildAndRun

  constructor(private collaboration: CollaborationService, 
    private route: ActivatedRoute,
    private dataService: DataService) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.sessionId = params['id']; // sessionId is problemID
      this.initEditor();
    })

    this.collaboration.restoreBuffer(); // get historical data  
  }

  initEditor(): void {
    this.editor = ace.edit("editor");
  	this.editor.setTheme("ace/theme/eclipse");

    this.resetEditor();
    
    document.getElementsByTagName('textarea')[0].focus(); // set focus
    this.collaboration.init(this.editor, this.sessionId);
    
    this.editor.lastAppliedChanged = null; 

    this.editor.on("change", (e) => {
      console.log('editor changes: ' + JSON.stringify(e));

      if(this.editor.lastAppliedChanged != e) { // avoid loop
        this.collaboration.change(JSON.stringify(e));
      }
    });


  }

  resetEditor(): void {
    this.editor.setValue(this.defaultContent[this.language]);
    this.editor.getSession().setMode("ace/mode/" + this.language.toLowerCase());
  }

  setLanguage(language: string): void {
    this.language = language;
    this.resetEditor();
  }

  submit(): void {
    let user_code = this.editor.getValue();
    console.log(user_code);

    const data = {
      code: user_code,
      lang: this.language.toLowerCase()
    };

    // buildAndRun rturn a Promise
    this.dataService.buildAndRun(data).then(res => this.output = res);
  }

}
