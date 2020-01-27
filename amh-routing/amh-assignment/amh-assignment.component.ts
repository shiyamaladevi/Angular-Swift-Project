import { Component, OnInit } from '@angular/core';
import { MenuConfig } from '../../models/menu/menu-config';
import { Option } from '../../models/referential/option/option.model';
import { AssignmentUnique, AssignmentConfig, AssignType } from '../../models/routing-amh';
import { Router, ActivatedRoute } from '@angular/router';
import { LogService, AuthService, ApplicationLogService } from '../../common/components/services';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { Alert } from '../../common/components/ui/widgets/modal';
import { AmhAssignmentService } from '../amh-service';
import { ApplicationLog } from '../../models/applicationLog'

@Component({
  selector: 'app-amh-assignment',
  templateUrl: './amh-assignment.component.html'
})
export class AmhAssignmentComponent implements OnInit {
//mig
  //@ViewChild(Alert) alert;
  bsAlertRef: BsModalRef;

  private disabledSaveButtons : boolean = false;
  private isCreation: boolean;

  private assignment: AssignmentUnique = undefined;
  private navigateUrl: string;
  private returnToString: string;
  private returnParameters: any = { };
  private assignmentConfig : AssignmentConfig;
  private optionRollback: Option;
  private saveStatus: string ="";
  private  confirmation : any = undefined;
  private originalAssignmentCode: string = "";
  
  // private menuConfig : Array<MenuConfig> = [
  //   new MenuConfig("fa fa-home","Home","Home"),
  //   new MenuConfig("fa fa-sitemap","AMHHome","AMH Routing"),
  //   new MenuConfig("fa fa-cloud-download","","Back End Assignment Rule Criteria")];
  
  private menuConfig : Array<MenuConfig> = [
    new MenuConfig("fa fa-home","/home","Home"),
    new MenuConfig("fa fa-university","/amh-routing","AMH Routing"),
    new MenuConfig("fas fa-cloud-download-alt","","Back End Assignment Rule Criteria")];

  private selectionTables : Array<Option> = [
    new Option(1,"BK_CH","Backend Selection"),
    new Option(2,"DTN_CPY","Distribution Copy Selection Table"),
    new Option(4,"FEED_DTN_CPY","Feedback Distribution Copy Selection Table")
  ];
  private defaultOption : Option;
  private saveAndContinue: boolean;
  private withRollbackType : AssignType;
  private log: ApplicationLog;
  
  constructor(private modalService: BsModalService,private router: Router, private activatedRouter: ActivatedRoute,private amhAssignmentService: AmhAssignmentService,
      private auth : AuthService, private applicationLogService: ApplicationLogService, private logger : LogService) { 
        
        this.activatedRouter.queryParams.subscribe(params => 
          {
            this.setReturnTo(params['return_to']);
            this.addReturnParamter("st", params['st']);
            this.updateSelectionTable(this.selectedAssignmentType(+ params['st']));
          });
  }

  ngOnInit() {
    //this.logger.log('hello `AMH assignment ` component');
  }

  private selectedAssignmentType(assignType : AssignType) : Option {
    let typeSelected = this.selectionTables.find((type) => { return type.id === assignType; });
    return typeSelected ? typeSelected : this.selectionTables[0]; 
  }
  
  private addReturnParamter(name : string, value : any) {
    if (!value) {
      return;
    }

    this.returnParameters[name] = value;
  }
   
  private setReturnTo(params: string) {
    // MIG this.returnToString = 'AMHHome';
    this.returnToString = 'amh-routing';

    //this.logger.log(" receiving params to return = " + params);

    if (!params || params.length == 0) {
      return;
    }

    let parameters = params.split('&');
    //MIG this.returnToString = parameters[0] || 'AMHHome';
    if(parameters[0])
    this.returnToString ='/amh-routing/' + parameters[0];
    //this.logger.log(" paramteres to return " + parameters);

  }

  private alertOpen() {
    //MIG
    // this.alert.alertFooter = false;
    // this.alert.cancelButton = false;
    // this.alert.okButton = false;
    // this.alert.alertHeader = true;
    // this.alert.alertTitle = "Alert";
    // this.alert.message = "Save in progress...";
    // this.alert.cancelButtonText = "Ok";
    // this.alert.cancelButtonResponse = 0;
    // this.alert.open();
    this.bsAlertRef = this.modalService.show(Alert, {initialState: {
      alertFooter: false,
      cancelButton: false,
      okButton: false,
      alertHeader: true,
      alertTitle: "Alert",
          //C180212 add waitIcon
      waitIcon : true,
      message:  "Save in progress...",
      cancelButtonText : "Ok",
    // this.alert.open();
      isOpen: true
      }
    });

    this.bsAlertRef.content.alertOutput.subscribe(resp => {
      this.logger.error("Child component\'s event was triggered"+ resp.data);
       this.alertResponse(resp.data)
    });

  }

  private closeAlert(saveAndContinue: boolean, withError? : boolean) {
    //setTimeout(() => this.alert.cancel(), 1000);
    //MIG this.alert.cancel();
    this.bsAlertRef.content.cancel();
    if (!saveAndContinue && !withError) {
      // setTimeout(() => this.router.parent.navigate([this.returnToString, this.returnParameters]), 1200);
      setTimeout(() => this.router.navigate([this.returnToString, this.returnParameters]), 1200);

    }
  }

 //ROMOVE this useless method
  private isValidAssigment(): any {
    if (!this.assignment) {
      return { isValid: false, errorMsgs: ["No assignment defined"] };
    }

    // let errorMessages = this.validateSequences();
    let errorMessages = "";


    return { isValid: (!errorMessages || errorMessages.length == 0), errorMsgs: errorMessages };
  }

 private msgEmptyRules() {
   //MIG
    // this.alert.waitIcon = false;
    // this.alert.alertFooter = true;
    // this.alert.okButton = false;
    // this.alert.alertHeader = true;
    // this.alert.alertTitle = "Alert";
    // this.alert.message = "No rules assigned. Every message will be send to the assigned backend(s).";
    // this.alert.cancelButton = true;
    // this.alert.cancelButtonText = "Cancel";
    // this.alert.cancelButtonResponse = 0;
    // this.alert.yesButton = true;
    // this.alert.yesButtonText = "OK";
    // this.alert.yesButtonResponse = 1;
    // this.alert.open();

    this.bsAlertRef = this.modalService.show(Alert, {initialState: {
      waitIcon: false,
      alertFooter: true,
      okButton: false,
      alertHeader: true,
      alertTitle: " Alert ",
      message:  "No rules assigned. Every message will be send to the assigned backend(s).",
      cancelButton: true,
      cancelButtonText: "Cancel",
      cancelButtonResponse: 0,
      yesButton: true,
      yesButtonText: "OK",
      yesButtonResponse: 1,
    // this.alert.open();
      isOpen: true
      }
    });

    this.bsAlertRef.content.alertOutput.subscribe(resp => {
      this.logger.error("Child component\'s event was triggered"+ resp.data);
      this.alertResponse(resp.data)
    });
  }

  alertResponse(resp){
    switch(resp) {
      case 0: //Empty rules cancel
        this.saveStatus = "Cancel";
      break;
      case 1: //Empty rules OK
        this.saveStatus = "";
        this.doSave(this.saveAndContinue, this.withRollbackType);
      break;
      case 300: //Navigation cancel response
        //Do nothing
      break;
      case 301: //Navigation Yes response, go ahead.
      //MIG TODO
        // this.router.parent.navigate([this.navigateUrl, this.returnParameters]);
        this.router.navigate([this.navigateUrl]);

      break;
    }
  }

  private save(saveAndContinue: boolean, withRollbackType ? : AssignType) {
    if (this.assignment.rules.length !=0) {
      // this.msgEmptyRules();
      this.saveAndContinue = saveAndContinue;
      this.withRollbackType = withRollbackType; 
    this.doSave(saveAndContinue, withRollbackType);
    return;
  }
    else{
      this.msgEmptyRules();
    }
  }

  private doSave(saveAndContinue: boolean, withRollbackType ? : AssignType) {
    let assignmentStatus = this.isValidAssigment();
    if (!assignmentStatus.isValid) {
      assignmentStatus.errorMsgs.forEach(x => this.logger.error(x));
    } 
    // else {
    //   this.logger.log("Everything is O.K assignment with sequence " + this.assignment.sequence);
    //   this.assignment.rules.forEach(r => this.logger.log("       " + r.code + " - " + r.sequence));
    // }

    let assignmentType = withRollbackType ? this.optionRollback.id : this.defaultOption.id;
  //  this.logger.log("saving assignment ..." + this.assignment.backendPrimaryKey);
    this.alertOpen();
    let send;

    if(!this.isCreation && this.originalAssignmentCode != this.assignment.code){
      this.amhAssignmentService.deleteAssignmentByCode(assignmentType, this.originalAssignmentCode).subscribe(
        ok=>{
          this.log = new ApplicationLog("AMH","",new Date(),this.auth.getUser().username,"amh.modify.assignment","AMH Assignment");
          this.log.extrInfo = "Create assignment - Type: " + (withRollbackType ? this.optionRollback.code : this.defaultOption.code) + " - Code:" + this.assignment.code + "."      
          this.amhAssignmentService.createAssignment(assignmentType, this.assignment, this.auth.getUser()).subscribe(
            data => {
              //this.logger.log("[saveRule] %s", data);
              this.log.succeed();
            },
            err => {
              this.logger.error("[saveRule] Can't get assignments. Error code: %s, URL: %s ", err.status, err.url);
              // MIG this.alert.message = "An error has occurred, the backend cannot be assigned !!";
              this.bsAlertRef.content.message = "An error has occurred, the backend cannot be assigned !!";
              this.closeAlert(saveAndContinue, true);
              this.saveStatus = "Error";
              if(saveAndContinue){

              }
              if (saveAndContinue) {
                this.confirmation = {msg: 'An error has occurred, while saving this assignment !!', type: 'danger', closable: true};
              }
              this.log.fail();
              this.log.extrInfo += " Error: " + err.message +".";
            }, () => {
              //this.logger.log("[saveRule] assignment's rules from backend [%s,%s+] retrieved");
              // MIG this.alert.message = "Assignment done sucessfuly !!";
              this.bsAlertRef.content.message = "Assignment done sucessfuly !!";
              setTimeout(()=>{
                this.closeAlert(saveAndContinue);
                if (saveAndContinue) {
                  this.confirmation = {msg: 'Assignment saved', type: 'success', closable: true};
                }
                this.saveStatus = "OK";
                this.isCreation = false;
              },1000)
            }
          ).add( ()=>{
            this.applicationLogService.saveApplicationLog(this.log).subscribe();
          });
        },
        err=>{
          this.router.navigateByUrl('/error')
        }
      )
      return;
    }

    if (this.isCreation) {
      send = this.amhAssignmentService.createAssignment(assignmentType, this.assignment, this.auth.getUser());
    } else {
      send = this.amhAssignmentService.saveAssignment(assignmentType, this.assignment, this.auth.getUser());
    }
    
    this.log = new ApplicationLog("AMH","",new Date(),this.auth.getUser().username,"amh.modify.assignment","AMH Assignment");
    this.log.extrInfo = (this.isCreation? "Create": "Update") + " assignment - Type: " + (withRollbackType ? this.optionRollback.code : this.defaultOption.code) + " - Code:" + this.assignment.code + "."
    send.subscribe(
      data => {
        //this.logger.log("[saveRule] %s", data);
        this.log.succeed();
      },
      err => {
        this.logger.error("[saveRule] Can't get assignments. Error code: %s, URL: %s ", err.status, err.url);
        // MIG this.alert.message = "An error has occurred, the backend cannot be assigned !!";
        this.bsAlertRef.content.message = "An error has occurred, the backend cannot be assigned !!";
        this.closeAlert(saveAndContinue, true);
        this.saveStatus = "Error";
        if (saveAndContinue) {
          this.confirmation = {msg: 'An error has occurred, while saving this assignment !!', type: 'danger', closable: true};
        }
        this.log.fail();
        this.log.extrInfo += " Error: " + err.message +".";
      }, () => {
        // this.logger.log("[saveRule] assignment's rules from backend [%s,%s+] retrieved");
        // MIG this.alert.message = "Assignment done sucessfuly !!";
        this.bsAlertRef.content.message = "Assignment done sucessfuly !!";
        setTimeout(()=>{
          this.closeAlert(saveAndContinue);
          if (saveAndContinue) {
            this.confirmation = {msg: 'Assignment saved', type: 'success', closable: true};
          }
          this.saveStatus = "OK";
          this.isCreation = false;
        },1000)
      }
    ).add( ()=>{
      this.applicationLogService.saveApplicationLog(this.log).subscribe();
    });
  }

  private actionCancel() {
   // this.logger.log("canceling assignment ...");
    this.verifyAndNavigate(this.returnToString, 300, 301);
    //this.router.parent.navigate([, this.returnParameters]);
  }

  private updateDisabledButtons(data) {
  //  this.logger.log("disabledSaveButtons ------------ " + data);
    this.disabledSaveButtons != data;
  }

  private saveWork(config) {
   // this.logger.log("saving work saveAndContinue=" + config.saveAndContinue+ " withRollback= "+  config.withRollbackType);
    this.save(config.saveAndContinue, config.withRollbackType);
  }

  private updateAssignment(assignment) {
  //  this.logger.log("assignment updated ------------  " + assignment);
  //  assignment.rules.forEach(rule => this.logger.log(" rule code in assignment " + rule.code));
    this.assignment = assignment;
  }

  private updateSelectionTable(option) {
    let codeToFind = this.defaultOption ? this.defaultOption.code : option.code; 
    this.optionRollback = this.selectionTables.find((innerOption) => { return innerOption.code === codeToFind; });
    this.defaultOption = option;
    this.assignmentConfig = new AssignmentConfig(option.id);
   // this.logger.log("selection table updated ------------  " + option.description + "  MAX " + this.assignmentConfig.maxBackendsAllowed);
  }

  private rollbackSelectionTable(rollbackCommand) {
    //  this.logger.log("rolling back to code " + this.optionRollback.code);
      if (this.assignmentConfig.type == this.optionRollback.id) {
        this.logger.debug("No changes to rollback");
        
        return;
      }
      this.defaultOption = this.optionRollback;
      this.assignmentConfig = new AssignmentConfig(this.defaultOption.id);
  }

  actionUpdateCreationStatus(isCreation : boolean) {
    this.isCreation = isCreation;
  }

  updateOriginalAssignmentCode(code){
    this.originalAssignmentCode = code;
  }


  private alertPreventLostChanges(cancelResponse: number, yesResponse : number) {
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
      this.alertResponse(resp.data)
    });
  }

  actionNavigate(link : string) {
    // this.logger.debug(" going to "+link);
    // this.logger.debug(" is dirty ?? "+this.amhAssignmentService.isAssignmentStatusDirty());
    this.verifyAndNavigate(link, 300, 301);
  }

  private verifyAndNavigate(link : string, cancelResponse : number, yesResponse : number) {
    let isDirty = this.amhAssignmentService.isAssignmentStatusDirty(); 
    if (isDirty) {
        this.logger.debug("inside if "+ isDirty);
        this.navigateUrl = link;
        this.alertPreventLostChanges(cancelResponse, yesResponse);
        return;
    }

    this.logger.debug("it was not dirty going to "+link); 
    // MIG this.router.parent.navigate([link, this.returnParameters]);
    this.router.navigate([link, this.returnParameters]);

  }

  test(){
    console.log(this.assignment.code)
    console.log(this.originalAssignmentCode)
    console.log(this.assignment.code == this.originalAssignmentCode)
  }

}
