import { Component, OnInit, OnChanges, Input, Output, EventEmitter, SimpleChange } from '@angular/core';
import { AssignmentConfig, AssignmentUnique, Backend, BackendPK, AssignType, AssignmentUniqueBackend, AssignmentUniqueRule } from '../../../models/routing-amh';
import { ActivatedRoute, Router, Data } from '@angular/router';
import { AuthService, LogService, Parameter } from '../../../common/components/services';
import { SharedAMHRule, SharedAssignmentUniqueService } from '../../../common/components/shared-services';
import { AmhAssignmentService } from '../../amh-service';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { Alert } from '../../../common/components/ui/widgets/modal';
import { Options } from 'selenium-webdriver/safari';
import { send } from 'q';
import { empty, Observable, observable } from 'rxjs';
import { flatMap } from 'rxjs/operators';
import { Type } from '@angular/compiler';
//import { type } from 'os';
// import { SharedAssignmentUniqueService } from 'src/app/models/routing-amh/shared_assignmentUnique.service';


@Component({
  selector: 'amh-assignment-content',
  templateUrl: './amh-assignment-content.component.html'
})
export class AmhAssignmentContentComponent implements OnInit, OnChanges {
// @ViewChild(Alert) alert;
  bsAlertRef: BsModalRef;

  @Input("selection-config") public config: AssignmentConfig;
  @Input("save-status") public saveStatus: string;
  @Output() public enableSaveButtons: EventEmitter<any> = new EventEmitter();
  @Output() public assignmentUpdate: EventEmitter<any> = new EventEmitter();
  @Output() public originalAssignmentCode: EventEmitter<string> = new EventEmitter();
  @Output() public saveWork: EventEmitter<any> = new EventEmitter();
  @Output() public rollbackSelection: EventEmitter<any> = new EventEmitter();
  @Output() public creationStatus: EventEmitter<boolean> = new EventEmitter<boolean>();

  private isCreation: boolean;
  private unconfirmedAssignmentCode: string = undefined;
 private assignment: AssignmentUnique = undefined;
  
  private receivedAssignmentCode: string;
  private assignmentTextFilter: string;
  private assignmentSequenceErrorMsg = "";
  private assignmentCopiesErrorMsg = "";
  private assignmentCodeErrorMsg = "";
  private isDirty : boolean = false;
  private disableInputs: boolean = true;
  private usedBackends: Array<Backend> = [];
  private haveRulesErrors : boolean = false;
  private pendingAssignmentSave: number = 0;
  private pendingNavigationConfig: any = {};
  private selectionRollbackType = undefined;
  private hasUserPermissions : boolean;
  private dcstSelectionGroup: boolean = false;
  private fbdcstSelectionGroup: boolean = false;
  private type = "AssignType";
  private selectionGroupErrorMsg = "";
  public static assign: AssignmentUnique = undefined;
  private fill: boolean = false;
  public returnToString: string;


  constructor(private modalService: BsModalService,private router: Router, private activatedRouter: ActivatedRoute, private amhAssignmentService: AmhAssignmentService
  , auth: AuthService, private logger: LogService, private parameter: Parameter, private _sharedAMHRule: SharedAMHRule) {
    this.activatedRouter.queryParams.subscribe(params => 
      {
        this.receivedAssignmentCode = params['code'];
        if(params['fill'])
          this.fill = true;
        if(params['return_to'])
          this.returnToString = params['return_to'];
      });

    //this.logger.log(" this.receivedAssignmentCode " + this.receivedAssignmentCode);

    this.assignmentTextFilter = this.receivedAssignmentCode || '';
    this.assignment = new AssignmentUnique(false, new BackendPK("", ""), "", "", "", "", undefined, undefined, "",undefined,undefined,"","", [], []);
    this.isCreation = false;
    this.pendingAssignmentSave = 0;
    this.hasUserPermissions = auth.hasPermission(["amh.modify.assignment"]) == 1;
    this.creationStatus.emit(this.isCreation);

    this.parameter.getParameter("AMH_DCST_SG").subscribe(
      data=>{
        if(data["parameter"]){
            if(data["parameter"]["keyValue"] == "ENABLE")
              this.dcstSelectionGroup = true;
             return  sessionStorage.setItem['code'];
        }
      },
      error =>{
        this.router.navigateByUrl('/error')
      }
    )

    this.parameter.getParameter("AMH_FBDCST_SG").subscribe(
      data=>{
        if(data["parameter"]){
          if(data["parameter"]["keyValue"] == "ENABLE")
            this.fbdcstSelectionGroup = true;
           return sessionStorage.setItem['code'];
        }
      },
      error =>{
        this.router.navigateByUrl('/error')
      }
    )
    
  }

  ngOnInit() {
    //this.logger.log('hello `AMH assignment content` component');
    if (!this.fill){
      this.selectionRollbackType = this.config.type;
      this.amhAssignmentService.updateDirtyStatus(this.isDirty);
      
      this.activatedRouter.url.subscribe(p=>{
        this.type = p[1].path;
        if(AmhAssignmentContentComponent.assign == undefined){
          if (this.type =="clone"){
            this.actionCreateNewAssignment();
            this.loadAssignment(this.receivedAssignmentCode, this.type);
    
          }else{
            this.loadAssignment(this.receivedAssignmentCode);
          }
        }else{
          this.assignment = AmhAssignmentContentComponent.assign;
          
          this.doEnableInputs();
          //this.haveRulesErrors = false;
          this.isDirty = this.amhAssignmentService.isAssignmentStatusDirty();
          this.assignmentUpdate.emit(this.assignment);
          this.fillBackends();
         
          setTimeout(()=>{
            AmhAssignmentContentComponent.assign = undefined;
          },1000)
        }
      })
    }
    else {
      this.activatedRouter.url.subscribe(p=>{
        this.type = p[1].path;
        this.assignment = SharedAssignmentUniqueService.toAssignmentUnique();
        this.fillBackends()
        if(this.type == "edit"){
          this.isCreation = false;
          this.doEnableInputs();
        }
        this.assignmentUpdate.emit(this.assignment);
        this.updateAssignmentCodeUniquenessErrorMsg(this.assignment.code)
        this.updateAssignmentUniquenessErrorMsg(this.assignment.sequence);
      })
    }

    
  }

/* SimpleChange
      previousValue: any;
      currentValue: any;
*/
  ngOnChanges(changes: { [propertyName: string]: SimpleChange }) {
    if (changes["config"]) {
      this.logger.debug("config has changed type "+this.config.type);
        if (this.selectionRollbackType != this.config.type) {
            this.confirmSelectionTableChanges(); 
            this.activatedRouter.url.subscribe(
              data=>{
                if(data.length>=2 && data[1].path == "create"){
                  this.actionCreateNewAssignment();
                }
              }
            )     
        }
    }
    let saveStatusChange : SimpleChange = changes["saveStatus"]; 
    this.logger.debug(" saveStatusChange === "+saveStatusChange+ " this.pendingAssignmentSave "+this.pendingAssignmentSave);
    if (saveStatusChange) {
      switch(saveStatusChange.currentValue) {
          case "OK":
              this.onSaveStatusOk();
          break;
        }
    }

    if (saveStatusChange && this.pendingAssignmentSave) {
        this.logger.debug("saveStatusChanged and pendingAssignmentSave == true");
        switch(saveStatusChange.currentValue) {
          case "OK":
              this.onSaveStatusOk();
              this.pendingAssignmentSave = 0;
          break;
          case "Error":
              this.onSaveStatusFail();
              this.pendingAssignmentSave = 0;
          break;
        }
        this.logger.debug("after switch pendingAsignmentSave");
    }
  }

  ngAfterViewInit(){

  }

  ngOnDestroy(){
    
  }

  private onSaveStatusFail() {
    switch(this.pendingAssignmentSave) {
      case 2: //after save change selection table
      //An error has ocurred the rollback the selection change
        this.rollbackSelection.emit(true);
      break;
     }    
  }

  private onSaveStatusOk() {
    switch(this.pendingAssignmentSave) {
      case 1: //after save go to Rule creation
        this.logger.debug(" save was OK then go to Rule creation");
        this.navigateTo(this.pendingNavigationConfig.composentName, this.pendingNavigationConfig.parameters);
      break;
      case 2: //after save change selection table
        this.logger.debug(" save was OK then change selection table");
        this.initialization();
        break;
      case 3:
      case 0:
        this.logger.debug(" save in creation was OK then call afterSaveNewAssignment");
        this.afterSaveNewAssignment();
      break;
     }
  }

  actionChangeRuleStatus(rulesStatus) {
    this.haveRulesErrors = rulesStatus;
    this.isDirty = true;
    this.amhAssignmentService.updateDirtyStatus(this.isDirty);
    this.emitDisableEnableSaveButtons();
  } 

  private addRule(addedRule) {
    this.assignment.rules = [addedRule, ...this.assignment.rules];
    this.assignmentUpdate.emit(this.assignment);
    this.isDirty = true;
    this.amhAssignmentService.updateDirtyStatus(this.isDirty);
    //this.logger.log(" adding " + addedRule.code + " to assignment ");
  }

  private deleteRule(deletedRuleCode) {
    this.assignment.rules = this.assignment.rules.filter((item: any) =>
      item["code"] !== deletedRuleCode);

    //  this.enableSaveButtons.emit(true);
    this.assignmentUpdate.emit(this.assignment);
    // this.isDirty = true;
    //this.logger.log(deletedRuleCode + " deleted ");
  }

  private addToBackendChannel(addedBackend) {
    this.assignment.backendPrimaryKey = new BackendPK(addedBackend.pkCode, addedBackend.pkDirection);

    // this.enableSaveButtons.emit(false); //???
    this.assignmentUpdate.emit(this.assignment);
    this.isDirty = true;
    this.amhAssignmentService.updateDirtyStatus(this.isDirty);
    // this.logger.log(" adding " + addedBackend.pkCode);
  }

  private addToMultiBackend(addedBackend) {
    
    let uniqueBackend = new AssignmentUniqueBackend(addedBackend.pkCode, addedBackend.pkDirection, addedBackend.dataOwner, addedBackend.lockCode);
    this.assignment.backends = [uniqueBackend, ...this.assignment.backends];

    // this.enableSaveButtons.emit(true); //??? verify if there is no errors before send the event
    this.assignmentUpdate.emit(this.assignment);
    this.isDirty = true;
    this.amhAssignmentService.updateDirtyStatus(this.isDirty);
    //this.logger.log(" adding " + addedBackend.code + " to assignment ");
  }

  private addBackend(addedBackend) {
    switch(this.config.type) {
      case AssignType.BK_CHANNEL:
        this.addToBackendChannel(addedBackend);
        break;
      case AssignType.DTN_COPY:
      case AssignType.FEED_DTN_COPY:
        this.addToMultiBackend(addedBackend);
    }
    this.fillBackends();
    this.emitDisableEnableSaveButtons();
  }

  private deleteToBackendChannel(backendCodeDeleted) {
    this.logger.debug(" from deleteToBackendChannel  " + backendCodeDeleted);

    if (!this.assignment.backendPrimaryKey || this.assignment.backendPrimaryKey.code != backendCodeDeleted) {
      //this.logger.log("backend code to delete [" + backendCodeDeleted + "] not found ");
      return;
    }

    this.assignment.backendPrimaryKey = undefined;

    // this.enableSaveButtons.emit(true); //???
    this.assignmentUpdate.emit(this.assignment);
    this.isDirty = true;
    this.amhAssignmentService.updateDirtyStatus(this.isDirty);
  }

  private deleteToMultiBackend(backendCodeDeleted) {
    this.assignment.backends = this.assignment.backends
              .filter((item: any) => item["code"] !== backendCodeDeleted);

    //  this.enableSaveButtons.emit(true);
    this.assignmentUpdate.emit(this.assignment);
    this.isDirty = true;
    this.amhAssignmentService.updateDirtyStatus(this.isDirty);
    //this.logger.log(backendCodeDeleted + " deleted ");
  }

  private deleteBackend(backendCodeDeleted) {
    switch(this.config.type) {
      case AssignType.BK_CHANNEL:
        this.deleteToBackendChannel(backendCodeDeleted);
        break;
      case AssignType.DTN_COPY:
      case AssignType.FEED_DTN_COPY:
        this.deleteToMultiBackend(backendCodeDeleted);
    }
    this.fillBackends();
    this.emitDisableEnableSaveButtons();
  }

  private fillBackends() {
    //this.logger.log("filling up backends ");
    let backends: Array<Backend> = [];
    switch (this.config.type) {
      case AssignType.BK_CHANNEL:
        if (this.assignment.backendPrimaryKey && this.assignment.backendPrimaryKey.code) {
          backends.push(new Backend(this.assignment.backendPrimaryKey.code, this.assignment.backendPrimaryKey.direction));
        }
        break;
      case AssignType.DTN_COPY:
      case AssignType.FEED_DTN_COPY:
        if (this.assignment.backends) {
          this.assignment.backends.forEach(backend => {
            backends.push(new Backend(backend.code, backend.direction));
          });
        }
        break;
    }

    this.usedBackends = backends;
  }

  selectAssignment(code) {
    //this.logger.log("selected assignment code " + code);
    if (!code) {
      this.logger.error("code[" + code + "] missing ");
      return;
    }
    this.unconfirmedAssignmentCode = code;
    this.confirmAssignmentChange();
  }

  selectSelectionGroup(sg){
    if(sg != this.assignment.selectionGroup){
      this.assignment.selectionGroup = sg
      this.actionSetDirtyTrue()
    }
  }

  selectionGroupUpdate(data){
    if(data){
      let value = (<HTMLInputElement>document.getElementById("selectionGroupInput")).value;
      if(value.length>0 && this.assignment.selectionGroup !=value){
        this.selectionGroupErrorMsg = "You should select a selection group from the list or leave the field empty."
      }else{
        this.selectionGroupErrorMsg = ""
      }
    }
    this.emitDisableEnableSaveButtons()
  }

  private hasThisAssignmentErrors() : boolean {
      let enableSaveButtons : boolean = this.assignmentSequenceErrorMsg.length > 0 && !this.assignmentSequenceErrorMsg.startsWith("The sequence"); 
      //this.logger.debug("1.- sequenceMsgErrors "+ enableSaveButtons);
      enableSaveButtons = enableSaveButtons || this.assignmentCodeErrorMsg.length > 0;
      //this.logger.debug("2.- CodeMsgError "+ (this.assignmentCodeErrorMsg.length > 0));
      enableSaveButtons = enableSaveButtons || this.haveRulesErrors;
      //this.logger.debug("3.- ruleErrors "+ this.haveRulesErrors);
   
      // has at least one backend assigned
      enableSaveButtons = enableSaveButtons || (!this.usedBackends || this.usedBackends.length < 1);
      //this.logger.debug("4.- backendSizeError "+ (!this.usedBackends || this.usedBackends.length < 1));
      // On creation has a code and sequence
      if (this.isCreation) {
          enableSaveButtons = enableSaveButtons || (!this.assignment.code || this.assignment.code.length == 0);
         // this.logger.debug("5.- onNew-CodeError "+ (!this.assignment.code || this.assignment.code.length == 0));
          enableSaveButtons = enableSaveButtons || (!this.assignment.sequence || this.assignment.sequence == 0);
         // this.logger.debug("6.- onNew-SequenceError "+ (!this.assignment.sequence || this.assignment.sequence == 0));
         enableSaveButtons = enableSaveButtons || (!this.assignment.rules || this.assignment.rules.length != 0);
        }

      if (document.activeElement.id =="selectionGroupInput"){

      }else{
        if(document.getElementById("selectionGroupInput")){
          enableSaveButtons = enableSaveButtons || this.selectionGroupErrorMsg.length > 0;
        }
      }

      return enableSaveButtons;
  }

  private emitDisableEnableSaveButtons() {
    this.enableSaveButtons.emit(this.hasThisAssignmentErrors());
  }

 private doDisableInputs() : void {
   this.logger.debug(" doDisable "+this.hasUserPermissions);
   this.disableInputs = true;
 }

 private doEnableInputs() : void {
   this.logger.debug(" doEnable "+this.hasUserPermissions);
   if (!this.hasUserPermissions) {
      this.disableInputs = true;
      return; 
   }

   this.disableInputs = false;
 }


  private loadAssignment(code: string, type?: string) {
    this.originalAssignmentCode.emit(code)
    if (!code || code.length == 0) {
      this.createNewAssignment();
      return;
    }

    this.amhAssignmentService.findAssignmentByCode(this.config.type, code)
      .subscribe(
      data => {
        data = data.hits[0]._source;
        //this.logger.log("[loadAssignment] Data retrieved from service: %s ", data.code);
        this.assignment = AssignmentUnique.fromJson(data);
        this.assignment.rules = this.assignment.rules.sort(
          (rule1, rule2) => {
            return rule1.sequence - rule2.sequence;
          });
        
        if(type != "clone"){
          this.isCreation = false;
          this.creationStatus.emit(this.isCreation);
        }else{
          this.assignmentCodeUpdate(code)
          this.assignmentSequenceUpdate(this.assignment.sequence)
          this.assignmentSequenceErrorMsg = "The sequence " + this.assignment.sequence + " is already used by the assignment " + code;
        }
        this.doEnableInputs();
        this.haveRulesErrors = false;
        this.isDirty = false;
        this.amhAssignmentService.updateDirtyStatus(this.isDirty);
        this.assignmentUpdate.emit(this.assignment);
        this.fillBackends();
        
      },
      err => {
        this.logger.warn("[loadAssignment] Can't get assignment. Error code: %s, URL: %s ", err.status, err.url);
        this.createNewAssignment();
        this.emitDisableEnableSaveButtons();
      },
      () => {
        //this.logger.log("[loadAssignment] assignment code [%s] retrieved", code);
        if (!this.assignment) {
          this.createNewAssignment();
        }
        this.emitDisableEnableSaveButtons();
      }
      );

  }

  actionCreateNewAssignment() {
    this.doEnableInputs();
    this.unconfirmedAssignmentCode = "";
    let hasAssignErros = this.hasThisAssignmentErrors();
    if (this.isDirty && hasAssignErros) {
        this.alertPreventLostChanges(400,401);
        return;
    }

    if (!this.isDirty || hasAssignErros) {
      this.loadAssignment(this.unconfirmedAssignmentCode);
      return;  
    }
    this.confirmAssignmentChange();
  }
  
  disableRuleCreation() {
    return this.disableInputs || this.hasThisAssignmentErrors();
  }

  // actionCreateNewRule() {
  //   if (!this.isDirty) {
  //     this.actionRuleNavigation(undefined);
  //     return;  
  //   }
  //   this.alertLostChanges(0, 201,202);
  // }

  private createNewAssignment() {
    //this.logger.log("creating new assignment");
    this.assignment = new AssignmentUnique(false, new BackendPK("", ""), "", "", "", "", undefined, undefined, "", undefined, undefined,"", "", [], []);
    this.fillBackends();
    this.isCreation = true;
    this.creationStatus.emit(this.isCreation);
    this.assignmentUpdate.emit(this.assignment);
    this.assignmentSequenceErrorMsg = "";
    this.assignmentCopiesErrorMsg = "";
    this.isDirty = false;
    this.amhAssignmentService.updateDirtyStatus(this.isDirty);
    this.haveRulesErrors = false;
    this.emitDisableEnableSaveButtons();
  }

  private isInteger(x: number): boolean {
    return x % 1 === 0;
  }

  private updateAssignmentUniquenessErrorMsg(sequence: number) {
    this.assignmentSequenceErrorMsg = "";
    this.logger.debug("[assingmentWithSequence] calling findAssignmentsBySequence(%s,%s)", this.config.type, sequence);
    this.amhAssignmentService.findAssignmentsBySequence(this.config.type, sequence)
      .subscribe(
      data => {
        //this.logger.log("[assingmentWithSequence] Data retrieved from service: %s with type %s", data.code, this.config.type);
        if (this.assignment.code != data.code || (this.assignment.code == data.code && this.type !="edit")) {
          this.assignmentSequenceErrorMsg = "The sequence " + sequence + " is already used by the assignment " + data.code;
        }
      },
      err => {
        this.logger.error("[assingmentWithSequence] Can't get assignments. Error code: %s, URL: %s ", err.status, err.url);
      },
      () => {
       // this.logger.log("[assingmentWithSequence] with msg [%s]", this.assignmentSequenceErrorMsg);
        this.emitDisableEnableSaveButtons();
      }
      );

  }

  private updateAssignmentCodeUniquenessErrorMsg(code: string) {
    this.assignmentCodeErrorMsg = "";
    this.amhAssignmentService.findAssignmentsByCode(this.config.type, code)
      .subscribe(
      data => {
        //this.logger.log("[assingmentWithCode] Data retrieved from service: %s, current %s ", data.code, this.assignment.code);
        this.assignmentCodeErrorMsg = "The code " + code + " already exists ";
      },
      err => {
        this.logger.error("[assingmentWithCode] Can't get assignments. Error code: %s, URL: %s ", err.status, err.url);
      },
      () => {
        //this.logger.log("[assingmentWithCode] with msg [%s]", this.assignmentCodeErrorMsg);
        this.emitDisableEnableSaveButtons();
      }
      );
  }

  private getRulesUniquenessErrorMsgs(): string[] {
    if (!this.assignment || !this.assignment.rules) {
      return [];
    }
    let hashRuleCode = {};

    let errorMessages: string[] = this.assignment.rules.filter(rule => {
      if (hashRuleCode[rule.sequence]) {
        return true;
      }

      hashRuleCode[rule.sequence] = rule;
      return false;
    }).map(rule => {
      return rule.sequence + " is used by " + rule.code.toUpperCase();
    });

    return errorMessages;
  }

  assignmentSequenceUpdate(value: number) {
    //this.logger.log("assignment " + this.assignment.code + " has changed its value to " + this.assignment.sequence);
    let numericSeqValue: number = value;
    let oldSequence = this.assignment.sequence;
    this.assignmentUpdate.emit(this.assignment);
    this.isDirty = true;
    this.amhAssignmentService.updateDirtyStatus(this.isDirty);

    if (!numericSeqValue || !this.isInteger(numericSeqValue) || numericSeqValue < 0 || numericSeqValue > 2147483647) {
      //this.logger.log(" not valid sequence " + numericSeqValue + " old value " + oldSequence);
      this.assignmentSequenceErrorMsg = "Assignment sequence is incorrect";
      this.emitDisableEnableSaveButtons();
      return;
    }

    this.assignment.sequence = numericSeqValue;
    this.updateAssignmentUniquenessErrorMsg(numericSeqValue);
  }

  assignmentCopiesUpdate(inputElem: HTMLInputElement) {
    //this.logger.log("assignment " + this.assignment.code + " has changed its copies value to " + this.assignment.copies);
    let numericCopiesValue: number = + inputElem.value;
    let oldCopies = this.assignment.copies;
    this.assignmentUpdate.emit(this.assignment);
    this.assignmentCopiesErrorMsg = "";

    if (!numericCopiesValue || !this.isInteger(numericCopiesValue) || numericCopiesValue < 0) {
      //this.logger.log(" not valid copies " + numericCopiesValue + " old value " + oldCopies);
      this.assignmentCopiesErrorMsg = "Assignment copies is incorrect";
      this.emitDisableEnableSaveButtons();
      return;
    }

    this.assignment.copies = numericCopiesValue;
    this.isDirty = true;
    this.amhAssignmentService.updateDirtyStatus(this.isDirty);
  }
 
  private isValidCode(code : string) : boolean {
    //^,$ are the begining and the end of the string respectively
    //to test https://regex101.com/#javascript
    let rex = new RegExp('^[A-Za-z0-9_%?!+=&@$°:;,|{}()\\[\\]\\"\'\\<\\>\\*\\s\\\\\/\.\-]*$');
    return rex.test(code);
  }

  assignmentCodeUpdate(value: string) {
    //this.logger.log("assignment code changed " + inputElem.value + " assignment code " + this.assignment.code);
    this.isDirty = true;
    this.amhAssignmentService.updateDirtyStatus(this.isDirty);
    this.assignment.code = value;
    
    if (!this.isValidCode(value)) {
       //this.assignmentCodeErrorMsg = "Valid characters are A-Z a-z 0-9 . - _ ";
       this.assignmentCodeErrorMsg = "Characters are not valid.";
    
       this.emitDisableEnableSaveButtons();
       return;
    }

    this.updateAssignmentCodeUniquenessErrorMsg(value);
  }

  private confirmAssignmentChange() {
      if (!this.isDirty) {
        //this.logger.log("Assignment has no changes so far");
        this.assignmentCodeErrorMsg = ""
        this.loadAssignment(this.unconfirmedAssignmentCode);
        return;
      }

      this.alertLostChanges();
  }

  private initialization() {
    this.assignmentTextFilter = "";
    this.assignmentCodeErrorMsg = "";
    this.createNewAssignment();
    this.doDisableInputs();
    this.isDirty = false;
    this.amhAssignmentService.updateDirtyStatus(this.isDirty);
  }

  private afterSaveNewAssignment() {
    this.assignmentTextFilter = "";
    this.assignmentCodeErrorMsg = "";
    this.assignmentSequenceErrorMsg = "";
    this.assignmentCopiesErrorMsg = "";
    this.isCreation = false;
    this.creationStatus.emit(this.isCreation);
    this.isDirty = false;
    this.amhAssignmentService.updateDirtyStatus(this.isDirty);
    this.haveRulesErrors = false;
    this.emitDisableEnableSaveButtons();
  }

  private confirmSelectionTableChanges() {
    let hasAssignErros = this.hasThisAssignmentErrors();
    if (this.isDirty && hasAssignErros) {
        this.alertPreventLostChanges();
        return;
    }

    if (!this.isDirty || hasAssignErros) {
        //this.logger.log("onChanges config.type = [" + this.config.type + "] hasThisAssignmentErrors " + hasAssignErros + " dirty " + this.isDirty);
        this.selectionRollbackType = this.config.type;
        this.initialization();
        return;
    }

    this.alertLostChanges(100, 101,102);
  }

  private alertPreventLostChanges(cancelResponse=300, yesResponse = 301) {
    //MIG 
    // this.alert.waitIcon = false;
    // this.alert.alertFooter = true;
    // this.alert.cancelButton = true;
    // this.alert.cancelButtonText = "Cancel";
    // this.alert.cancelButtonResponse = cancelResponse;
    // this.alert.yesButton = true;
    // this.alert.yesButtonText = "Yes";
    // this.alert.yesButtonResponse = yesResponse;
    // this.alert.okButton = false;
    // this.alert.alertHeader = true;
    // this.alert.alertTitle = " Alert ";
    // this.alert.message = "All changes will be lost, Do you want to continue?";
    // this.alert.open();
    this.bsAlertRef = this.modalService.show(Alert, {initialState: {
      waitIcon: false,
      alertFooter: true,
      cancelButton: true,
      cancelButtonText: "Cancel",
      cancelButtonResponse: cancelResponse,
      yesButton: true,
      yesButtonText: "Yes",
      yesButtonResponse: yesResponse,
      okButton: false,
      alertHeader: true,
      alertTitle: " Alert ",
      message:  "All changes will be lost, Do you want to continue?",
    // this.alert.open();
      isOpen: true
      }
    });

    this.bsAlertRef.content.alertOutput.subscribe(resp => {
      this.logger.error("Child component\'s event was triggered"+ resp.data);
      this.confirmClose(resp.data)
    });
  }

  private alertLostChanges(cancelResponse=0, yesResponse = 1, okResponse = 2) {
    // MIG
    // this.alert.waitIcon = false;
    // this.alert.alertFooter = true;
    // this.alert.cancelButton = true;
    // this.alert.cancelButtonText = "Cancel";
    // this.alert.cancelButtonResponse = cancelResponse;
    // this.alert.yesButton = true;
    // this.alert.yesButtonText = "Yes";
    // this.alert.yesButtonResponse = yesResponse;
    // this.alert.okButton = true;
    // this.alert.okButtonText = "No";
    // this.alert.okButtonResponse = okResponse;
    // this.alert.alertHeader = true;
    // this.alert.alertTitle = " Alert ";
    // this.alert.message = "Do you want to save the changes done?";
    // this.alert.open();
    this.bsAlertRef = this.modalService.show(Alert, {initialState: {
      // waitIcon: false,
      // alertFooter: true,
      // cancelButton: true,
      // cancelButtonText: "Cancel",
      // cancelButtonResponse: cancelResponse,
      // yesButton: true,
      // yesButtonText: "Yes",
      // yesButtonResponse: yesResponse,
      // okButton: true,
      // okButtonText: "No",
      // okButtonResponse: okResponse,
     
      message:  "The form is saved!!",
    // this.alert.open();
      isOpen: true
      }
    });

    this.bsAlertRef.content.alertOutput.subscribe(resp => {
      this.logger.error("Child component\'s event was triggered"+ resp.data);
      this.confirmClose(resp.data)
    });
  }

  confirmClose(data) {
    this.logger.log("confirming ------------  " + data);
    
   
    switch(data) {
      case 0:
      case 400: //on Create Assignment, cancel do nothing.
        //this.logger.log("confirm cancel, do nothing");
        break;
      case 1:
        if (this.isCreation) {
           //If is creation then on save disable assignment code
           this.pendingAssignmentSave = 4;
        }
        this.saveWork.emit({"withRollbackType":false, "saveAndContinue":true});
      break;
      case 2:
        this.assignmentCodeErrorMsg = "" 
        this.loadAssignment(this.unconfirmedAssignmentCode);
      break;
      case 100: //Cancel selection table change
      case 300: //On dirty, Cancel change selection table
        //this.logger.log("change assign cancel, rollback selection table");
        this.rollbackSelection .emit(true);
        break;
      case 101: // save and change selection table
        this.saveWork.emit({"withRollbackType":true, "saveAndContinue":true});
        //TODO: do the initialization only if save was OK.
        //TODO: Add parentEventEmitter to do the initialization part.
        this.pendingAssignmentSave = 2;
        this.selectionRollbackType = this.config.type;
        break;
      case 102: //Do not save and just change selection table
     
      case 301: //On dirty, do not save and just change selection table
        this.initialization();
        this.selectionRollbackType = this.config.type;
        break;
      case 201: //save and go to rule creation
        this.saveWork.emit({"withRollbackType":false, "saveAndContinue":true});
        this.pendingAssignmentSave = 1;
      break;
      case 202: // do not save and go to rule creation
        this.router.navigate(['amh-routing/rule/create'], {queryParams: this.pendingNavigationConfig.parameters}); 
       break;
       case 401: // on Create Assignment, lost changes clicked, so load empty assignment
          this.loadAssignment(this.unconfirmedAssignmentCode);
        break;
      default: return;
    }
    
  }

  alertOpen() {
   this.bsAlertRef = this.modalService.show(Alert, {initialState: {
      alertFooter: false,
      cancelButton: false,
      okButton: false,
      alertHeader: true,
      alertTitle:  "Alert",
      message:  "Save in progress...",
      cancelButtonText : "Ok",
      isOpen: true
      }
    });

    this.bsAlertRef.content.alertOutput.subscribe(resp => {
      
      this.logger.error("Child component\'s event was triggered"+ resp.data);
    }); 
  }

  

  closeAlert() {
    // setTimeout(() => this.alert.cancel(), 1000);
    
    setTimeout(() => this.bsAlertRef.content.cancel(), 1500);
    this.isDirty = true;
    let returnTo = "assignment/" + (this.isCreation ? "create" : "edit");
    this.router.navigate(['amh-routing/rule/create'],{queryParams: {'return_to': returnTo, "st": this.config.type, "return": this.returnToString}});

  }
  // private verifyAndNavigate(link : string, cancelResponse : number, yesResponse : number) {
     
  //   if (this.isDirty) {
  //       this.logger.debug("inside if "+ this.isDirty);
  //       this.navigateUrl = link;
  //       this.router.navigate(['amh-routing/rule/create'],{queryParams: {'at':this.defaultOption.id,'return_to':'amh-rule-overview'}});
        
  //       return;
  //   }

  // }
  private getAssignmentPath(type : AssignType) : string {
    switch(type) {
      case AssignType.BK_CHANNEL:
        return "assignments";
      case AssignType.DTN_COPY:
        return "distributionCopies";
      case AssignType.FEED_DTN_COPY:
        return "feedbackDtnCopies";
      default:
      return "assignments";
    }
  }

  /*
  findAssignments(type : AssignType): Observable<any> {
    return this.http.post(this.config.get("esBackUrl")+"/amhrouting/"+this.getAssignmentPath(type)+"/_search?size=10000",'{"sort": [{"sequence": {"order": "asc"}}]}');
    
  }
  */

 /*
  actionRuleNavigation(ruleCode) {
    let parameters = { 'code': ruleCode, 'return_to':'assignment/edit','params':'code='+this.assignment.code+'&st='+this.config.type }
    if (this.hasThisAssignmentErrors()) { //If there are some errors do not navigate
      return;
    }
    if (!this.isDirty) {
    //MIG  this.navigateTo("AMHRuleCreate", parameters); 
    //this.router.navigate(['amh-routing/rule/create'], {queryParams: parameters}); 
    this.router.navigate(['amh-routing/rule/create'],{queryParams: {'return_to':'assignment/edit'}});
      return;  
    }
    //this.pendingNavigationConfig = {"composentName":"AMHRuleCreate" , "parameters": parameters}
    this.pendingNavigationConfig = {"composentName":"AMHRuleCreate" , "parameters": {queryParams: {'return_to':'assignment/edit'}}};
    this.alertLostChanges(0, 201,202);
  }
  */


  actionRuleNavigation(ruleCode?) {
    SharedAssignmentUniqueService.fromAssignmentUnique(this.assignment)
    this.alertOpen();
    this.bsAlertRef.content.message = "The form saved successfuly !!";
    setTimeout(() => this.bsAlertRef.content.cancel(), 1500);
    this.isDirty = true;
    let returnTo = "assignment/" + (this.isCreation ? "create" : "edit");
    
    this.emitDisableEnableSaveButtons();
    if (!ruleCode){
      this._sharedAMHRule.clearAll();
    }
    let queryParams = {'return_to': returnTo, 'st': this.config.type, 'return': this.returnToString}

    this.router.navigate(['amh-routing/rule/create'],{'queryParams': queryParams});

  }
  
  private navigateTo(targetComponent : string, parameters : any) {
    //MIG  this.router.parent.navigate([targetComponent, parameters])
    this.router.navigate([targetComponent, parameters])

  }

  actionSetDirtyTrue() {
    this.isDirty = true;
    this.amhAssignmentService.updateDirtyStatus(this.isDirty);
  }
}
