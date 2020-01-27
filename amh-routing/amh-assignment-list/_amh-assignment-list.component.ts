import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { Option } from '../../models/referential/option/option.model';
import { AssignType, AssignmentList } from '../../models/routing-amh';
import { ActivatedRoute, Router } from '@angular/router';
import { LogService, AuthService, Parameter, ApplicationLogService } from '../../common/components/services';
import { AmhAssignmentService } from '../amh-service';
//import { BootstrapPaginator, DataTable, DataEvent, PageEvent, SortEvent, DefaultSorter, Paginator} from '../../common/components/ui/widgets/general-datatable';
import { MenuConfig } from '../../models/menu/menu-config';
import { ApplicationLog } from '../../models/applicationLog'
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { Alert } from '../../common/components/ui/widgets/modal';
import { BootstrapPaginatorOverview, DataTableOverview, DataEventOverview, PageEventOverview, SortEventOverview, DefaultSorterOverview, PaginatorOverview  } from '../../common/components/ui/widgets/overview-datatable';
import { FormControl, FormGroup } from '@angular/forms';
import { SharedAMHRoutingOverview, SharedAMHRule } from '../../common/components/shared-services'
import { AmhSelectionGroupSelectionComponent  } from '../amh-selection-group-selection/amh-selection-group-selection.component'
import {debounceTime, switchMap} from 'rxjs/operators';
// import { SharedAssignmentUniqueService } from 'src/app/models/routing-amh/shared_assignmentUnique.service';

declare var $:any;


@Component({
  selector: 'amh-assignment-list',
  styles: [`
    h1 {
      font-family: Arial, Helvetica, sans-serif
    }
    .table{
      display:block;
    }
    #exportResultOnly{
       color:yellowgreen;
    }
    @supports (-webkit-appearance:none) {
      #exportResultOnly{
        background: linear-gradient(to right,white,green);
        -webkit-background-clip:text !important; 
         background-clip:text !important; 
         color:transparent;
      }
    }
    #exportAll{
      color: darkgreen;
    }
    @supports (-webkit-appearance:none) {
      #exportAll{
         color:green;
      }
    }
  `],
  templateUrl: './amh-assignment-list.component.html'
})
export class AmhAssignmentListComponent implements OnInit {
  //@ViewChild("filterText") filterValue;
  @ViewChild(DataTableOverview) table;
 // @ViewChild(Alert) alert;
  private defaultOption :Option;
  private data: Array<AssignmentList> = [];
  private original: Array<AssignmentList> = [];
  private menuConfig : Array<MenuConfig> = [
    new MenuConfig("fa fa-home","/home","Home"),
    new MenuConfig("fa fa-university","/amh-routing","AMH Routing"),
    new MenuConfig("fa fa-list","","Routing Overview")
    ];

  private selectionTables : Array<Option> = [
    new Option(AssignType.BK_CHANNEL,"BK_CH","Backend Selection"),
    new Option(AssignType.DTN_COPY,"DTN_CPY","Distribution Copy Selection Table"),
    new Option(AssignType.FEED_DTN_COPY,"FEED_DTN_CPY","Feedback Distribution Copy Selection Table")
  ];
  
  
  bsAlertRef: BsModalRef;
  private searchForm : FormGroup;

  private selectionGroups : Array<string> = [];
  private searchSelectionGroup: string = "";
  private selectedSelectionGroup : string ="";

  private dcstSelectionGroup: boolean = false;
  private fbdcstSelectionGroup: boolean = false;

  private log: ApplicationLog;

  constructor(private modalService: BsModalService,private activatedRouter: ActivatedRoute, private amhAssignmentService: AmhAssignmentService,
     private auth: AuthService, private logger : LogService, private router: Router, private parameter: Parameter, private applicationLogService: ApplicationLogService,
     private _sharedAMHRoutingOverview: SharedAMHRoutingOverview, private _sharedAMHRule: SharedAMHRule) {
       
      this.parameter.getParameter("AMH_DCST_SG").subscribe(
        data=>{
          if(data["parameter"]){
              if(data["parameter"]["keyValue"] == "ENABLE")
                this.dcstSelectionGroup = true;
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
          }
        },
        error =>{
          this.router.navigateByUrl('/error')
        }
      )



  //  this.logger.log(" from assigList "+this.config.get("esBackUrl"));
 
    //activatedRouter.params.subscribe( params => {
      // this.logger.error("params" + params['action'])
      //this.defaultOption = this.selectedAssignmentType(+ params['st']);

     // this.logger.error("st " + st);
    //});
    this.defaultOption = this.selectedAssignmentType(_sharedAMHRoutingOverview.getAssignmentType());
   // this.defaultOption = this.selectedAssignmentType(+ routeParams.params['st']);
   //this.loadAssignments(this.defaultOption);

   this.searchForm = new FormGroup({
    // C180801
   // 'searchInput': new FormControl('', [] )
    'searchInput': new FormControl("", [] )
  });

  let temp = [];
  let tt = "";

  //this.selectedSelectionGroup = this._sharedAMHRoutingOverview.getSelectionGroup() ? this._sharedAMHRoutingOverview.getSelectionGroup() : "";
  this.searchSelectionGroup = this.selectedSelectionGroup;

  let obs1 = this.searchInput.valueChanges.pipe(
    debounceTime(1000),
    switchMap(filterText => {
      // J'ecris ma recherche
      // C180801
      //this._sharedAMHRoutingOverview.setSearchBar(filterText)
      tt = filterText ;
      return this.amhAssignmentService.findAssignments(this.defaultOption.id)
  }));
  // filterText est la valeur saisie en temps reel (retour de obs1)
  // this.searchInput.valueChanges.debounceTime(50)
  obs1.subscribe(
    //
    data => {
      this.original = [];
      let resp = AmhAssignmentService.getFromSource(data); 
      console.error(resp)// si on augmente ?size=1000 0 => resp.size = 3338
      resp.map(assign => {
       // this.logger.debug(" loading "+assign.code)
       if (this.defaultOption.id != 1){
        if(!this.selectionGroups.includes(assign.selectionGroup) && assign.selectionGroup != undefined && assign.selectionGroup != null && assign.selectionGroup != "" )
          this.selectionGroups.push(assign.selectionGroup);
          this.selectionGroups = this.selectionGroups.sort();
      }
        this.original = this.original.concat(this.fromJsonToAssignList(this.defaultOption.id, assign));
      });
      this.logger.debug("final size "+ this.original.length);
      // this.data.forEach(value => this.logger.log(" assignList "+value.code+" rule "+ value.ruleExpressions));
      if(this.selectedSelectionGroup != "" && this.selectedSelectionGroup!= undefined && this.selectedSelectionGroup!= null){
        this.data = this.original.filter(_=> _.selectionGroup == this.selectedSelectionGroup)
      }
      else
        this.data = this.original;
      this.updateData(tt)
    },
    err =>
      this.logger.error("Can't get assignments. Error code: %s, URL: %s ", err.status, err.url)
  );

  //this.searchInput.setValue(this._sharedAMHRoutingOverview.getSearchBar() ? this._sharedAMHRoutingOverview.getSearchBar() : "")

  //this.table.setSort("code","asc")

  

}

  /*
  private selectedAssignmentType(assignType : AssignType) : Option {
    let typeSelected = this.selectionTables.find((type) => { return type.id === assignType; });
    return typeSelected ? typeSelected : this.selectionTables[0]; 
  }
  */
  get searchInput() { return this.searchForm.get('searchInput'); }

  private selectedAssignmentType(option : Option) : Option {
    let optionSelected;
    if (option != undefined) 
      optionSelected = this.selectionTables.find((type) => { return type.id == option.id; });
    return optionSelected ? optionSelected : this.selectionTables[0]; 
  }


  ngOnInit() {

    this.logger.log('hello `AMH assignment list` component');
    console.log($('[data-toggle="tooltip"]'))
    setTimeout(()=>{
      $('[data-toggle="tooltip"]').tooltip()
    },0)


  setTimeout(()=>{
    
    document.body.scrollTop = SharedAMHRoutingOverview.bodyScrollTop;
    document.documentElement.scrollTop = SharedAMHRoutingOverview.documentElementScrollTop;
   
    },500)

  }

  ngAfterViewChecked(){
    this.multiMarkSearchWord(this.searchInput.value)
  }

  multiMarkSearchWord(keyword){
    var regExp = new RegExp(keyword.replace("(","\\(").replace(")","\\)").replace("?","\\?"), 'g')
    for (let i=0; i<document.getElementsByClassName("highlight").length; i++){
      document.getElementsByClassName("highlight")[i].innerHTML = document.getElementsByClassName("highlight")[i].innerHTML.replace(new RegExp("<mark>",'g'),"").replace(new RegExp("</mark>",'g'),"")
      if(String(regExp) != "/(?:)/g" && String(regExp) != "//g"){
        let text = document.getElementsByClassName("highlight")[i].textContent
          .replace(new RegExp("<",'g'),"&lt;").replace(new RegExp(">",'g'),"&gt;")
        let newText = text
          //.replace("&lt;","<").replace("&gt;",">").replace("&quot;","\"").replace("&apos;","\'").replace("&amp;","&")
          .replace(regExp, '<mark>' + keyword + '</mark>')
        document.getElementsByClassName("highlight")[i].innerHTML = document.getElementsByClassName("highlight")[i].innerHTML.replace(text, newText)
      }
    }
    
  }

  private loadAssignments(option: Option) {
  //  console.error("loadAssignments( "+option+" )")
    if (option == undefined ) {
      option = this.selectionTables[0];
    }

    this.original = [];
    this.selectionGroups = [];
    this.amhAssignmentService.findAssignments(option.id).subscribe( 
      // data retreived from ES amhrouting/distributionCopies/_search?size=1000 
      // data.size = 3338
      data => {
        let resp = AmhAssignmentService.getFromSource(data); 
        console.error(resp)// si on augmente ?size=1000 0 => resp.size = 3338
        resp.map(assign => {
         // this.logger.debug(" loading "+assign.code)

          this.original = this.original.concat(this.fromJsonToAssignList(option.id, assign));
        });

        this.logger.debug("final size "+ this.original.length);
        // this.data.forEach(value => this.logger.log(" assignList "+value.code+" rule "+ value.ruleExpressions));
        this.data = this.original;
      },
      err =>
        this.logger.error("Can't get assignments. Error code: %s, URL: %s ", err.status, err.url),
        () => {
        }
     // ,( ) => this.logger.log('Assignment(s) are retrieved')
    );

  }

  private fromJsonToAssignList(type : AssignType, assign) : Array<AssignmentList> {
    //console.error("fromJsonToAssignList( "+ type+" )")
   // console.error(assign)
    let list : Array<AssignmentList> = []; 
    let backends = new Array<string>();
    let backend = "";
    
    switch(type) {
      case AssignType.BK_CHANNEL:

        if (assign.rules.length > 0) {
            assign.rules.map( rule => {
                list.push(new AssignmentList(assign.active, assign.code, assign.backendPrimaryKey.code, assign.backendPrimaryKey.direction,
                "",assign.sequence, rule.code, rule.expression, rule.sequence, assign.environment, assign.version));
            });
            list = list.sort((assig1,assig2) => { 
                return (assig1.backSequence * 100 + assig1.ruleSequence) - (assig2.backSequence * 100 + assig2.ruleSequence); 
            });
        } else {
          
          list.push(new AssignmentList(assign.active, assign.code, assign.backendPrimaryKey.code, assign.backendPrimaryKey.direction,
                "", assign.sequence, "", "", undefined, assign.environment, assign.version)); 
          
        }
      break;
      case AssignType.DTN_COPY:
      /*
  
      let _isBackendLarger = assign.rules.length <= assign.backends.length; 
      let _largestList = this.getList(_isBackendLarger, assign, ["code","sequence"]);
      let _smallest = this.getList(!_isBackendLarger, assign, ["code","sequence"]);
      
      _largestList.map( large => {
            let backend = this.getBackendInfo(_isBackendLarger ? [large] : _smallest.splice(0,1));

            let rule = this.getRuleInfo(_isBackendLarger ? _smallest.splice(0,1): [large]); 

            list.push(new AssignmentList(assign.active, assign.code, backend.code, backend.direction ,
            "",assign.sequence, rule.code, rule.expression, rule.sequence, assign.environment, assign.version, assign.stopMarker));
          });
      */
          
          assign.backends.map( b => {
            backends.push(b.code);
          })
          backends = backends.sort()
          
          backends.map( b => {
            backend += b + "<br/>"
          })
          backend = backend.slice(0,backend.length-2)



          if (assign.rules.length > 0) {
            assign.rules.map( rule => {
              list.push(new AssignmentList(assign.active, assign.code, backend ,"",
              "",assign.sequence, rule.code, rule.expression, rule.sequence, assign.environment, assign.version, assign.stopMarker, assign.selectionGroup));
            });
            list = list.sort((assig1,assig2) => { 
                return (assig1.backSequence * 100 + assig1.ruleSequence) - (assig2.backSequence * 100 + assig2.ruleSequence); 
            });
          } else {
            
            list.push(new AssignmentList(assign.active, assign.code, backend ,"",
              "",assign.sequence, "", "", undefined, assign.environment, assign.version, assign.stopMarker, assign.selectionGroup)); 
            
          }


      break;
      case AssignType.FEED_DTN_COPY:

      /*
      let isBackendLarger = assign.rules.length <= assign.backends.length; 
      let largestList = this.getList(isBackendLarger, assign, ["code","sequence"]);
      let smallest = this.getList(!isBackendLarger, assign, ["code","sequence"]);
      
      largestList.map( large => {
            let backend = this.getBackendInfo(isBackendLarger ? [large] : smallest.splice(0,1));
            let rule = this.getRuleInfo(isBackendLarger ? smallest.splice(0,1): [large]); 
            list.push(new AssignmentList(assign.active, assign.code, backend.code, backend.direction ,
            "",assign.sequence, rule.code, rule.expression, rule.sequence, assign.environment, assign.version));
          });
        */
       
       assign.backends.map( b => {
         backends.push(b.code);
       })
       backends = backends.sort()
       
       backends.map( b => {
         backend += b + "<br/>"
       })
       backend = backend.slice(0,backend.length-2)

      if (assign.rules.length > 0) {
        assign.rules.map( rule => {
          list.push(new AssignmentList(assign.active, assign.code, backend ,"",
          "",assign.sequence, rule.code, rule.expression, rule.sequence, assign.environment, assign.version));
        });
        list = list.sort((assig1,assig2) => { 
            return (assig1.backSequence * 100 + assig1.ruleSequence) - (assig2.backSequence * 100 + assig2.ruleSequence); 
        });
      } else {
        
        list.push(new AssignmentList(assign.active, assign.code, backend ,"",
          "",assign.sequence, "", "", undefined, assign.environment, assign.version)); 
        
      }
      break;
    }
    
    return list;
  } 
  
  private getList(isBackendLarger : boolean, assign, fieldNamesComp : Array<string>) {
    let list = isBackendLarger ? assign.backends : assign.rules;
    let fieldName = isBackendLarger ? fieldNamesComp[0] : fieldNamesComp[1];
    return this.sort(list, fieldName);
  }

  private sort(input : Array<any>, fieldToCompare : string) : Array<any> {
     return input.sort((a,b) => {
           if (a[fieldToCompare] < b[fieldToCompare])
            return -1;
          if (a[fieldToCompare] > b[fieldToCompare])
            return 1;
          return 0;
        });
  }

  private getBackendInfo(backends : Array<any>) : any {
    if ( backends.length == 0 ) {
        return {"code":"", "direction":""};
    }
    return {"code":backends[0].code, "direction":backends[0].direction};
  }

  private getRuleInfo(rules : Array<any>) : any {
    if ( rules.length == 0 ) {
        return { "code":"", "expression":"", "sequence":undefined };
    }
    return { "code":rules[0].code, "expression":rules[0].expression, "sequence":rules[0].sequence };
  }
  
  private updateSelectionTable(option) {
    //let codeToFind = this.defaultOption ? this.defaultOption.code : option.code; 
    //this.optionRollback = this.selectionTables.find((innerOption) => { return innerOption.code === codeToFind; });
    this.defaultOption = option;
    this._sharedAMHRoutingOverview.setAssignmentType(this.defaultOption);
    this.searchInput.setValue("");
    this.loadAssignments(this.defaultOption);
    //this.filterValue.nativeElement.value = "";
    let pageEvent = this.table.getPage();
    //return pageEvent = {activePage: this.activePage, rowsOnPage: this.rowsOnPage, dataLength: this.inputData.length};
    this.table.setPage(1, pageEvent.rowsOnPage);
    //this.assignmentConfig = new AssignmentConfig(option.id);
    //this.logger.log("selection table updated ------------  " + option.description);
  }

   updateData( filterText) {
     this.data = this.changeFilter(this.data, {filtering:{filterString:filterText, columnName:"ruleExpressions"}});
   }
   
   private changeFilter(data:any, config:any):any {
    if (!config.filtering) {
      return data;
    }

    let valueToFind = config.filtering.filterString.replace("(","\\(").replace(")","\\)").replace("?","\\?");
    let filteredRuleExpresssion:Array<any> = data.filter((item:any) =>
      item[config.filtering.columnName].match(valueToFind));
     
    let filteredCode:Array<any> = data.filter((item:any) =>
      item["code"].match(valueToFind));
    
    let filteredBackendCode:Array<any> = data.filter((item:any) =>
      item["backCode"].match(valueToFind));
      
    let filteredRuleCode:Array<any> = data.filter((item:any) =>
      item["ruleCode"].match(valueToFind));
      
    let filteredData =  filteredRuleExpresssion.concat(filteredCode).concat(filteredBackendCode).concat(filteredRuleCode);
      
    let uniqueList : Array<any>= [];
    filteredData.forEach( item => {
        let found = uniqueList.find((value, index, array) =>  {
              return item["code"] == value["code"] && item["backCode"] == value["backCode"] && item["ruleCode"] == value["ruleCode"];
            });
        if (!found) {
          uniqueList.push(item);
        }
    });

    return uniqueList;
  }
  
  actionExportCSVFile(all: boolean) {
    
    /*
    if (this.data.length == 0) {
      this.logger.log(" there is no assignments in the overview to export ");
      return;
    }
    */
    //this.logger.log(" exporting assignment overview ");

    let searchValue : string = "";
    let selectionGroup : string = "";
    if(!all){
      searchValue = this.searchInput.value;
      selectionGroup = this.selectedSelectionGroup;
    }
 

    this.alertOpen();
    console.error(this.defaultOption.id)
    this.amhAssignmentService
      //.exportOverview(this.defaultOption.id, this.auth.getUser())
      .exportOverview(this.defaultOption.id, this.auth.getUser(),searchValue,selectionGroup)
      .subscribe(
      data => {
        //this.logger.log("[EXPORT_CSV] %s", data);
        console.error(data)
        this.amhAssignmentService.downloadFile("/amhrouting/csv/export/assignments/" + data.fileName, data.fileName)
      //  this.fileDownloader.download(this.config.get("backUrl") + "/amhrouting/csv/export/" + data.fileName, data.fileName);
      },
      err => {
        this.logger.error("[EXPORT_CSV] Can't be done. Error code: %s, URL: %s ", err.status, err.url),
          // MIG this.alert.message = " An error has occurred while downloading the asynchronous execution result";
        this.bsAlertRef.content.message = " An error has occurred while downloading the asynchronous execution result";
        this.closeAlert();
      },
      () => {
      //  this.logger.log("[EXPORT_CSV]  from backend done");
        // MIG this.alert.message = "Download Done.";
        this.bsAlertRef.content.message = "Download Done.";
        this.closeAlert();

      });
  }

  private closeAlert() {
   // setTimeout(() => this.alert.cancel(), 1000);
   setTimeout(() => this.bsAlertRef.content.cancel(), 1000);

  }

   private alertOpen() {
    /* MIG
    this.alert.alertFooter = false;
    this.alert.cancelButton = false;
    this.alert.okButton = false;
    this.alert.alertHeader = true;
    this.alert.alertTitle = "Download in progress ";
    this.alert.message = "This alert will be close when the download finish.";
    this.alert.cancelButtonText = "Ok";
    this.alert.open();*/
    this.bsAlertRef = this.modalService.show(Alert, {initialState: {
      alertFooter :false,
      cancelButton : false,
      okButton : false,
      alertHeader : true,
      alertTitle : "Download in progress ",
      message : "This alert will be close when the download finish.",
      cancelButtonText : "Ok",
    // this.alert.open();
      isOpen: true
      }
    });

    // MIG TjRs mettre ici la fonction presente dans <alert>
   // <!-- <alert (alertOutput)="alertResponse($event)"></alert> -->
        // Modal envoie le message qui vient d'etre saisi dans son input à son père 
  // qui est message handler
  this.bsAlertRef.content.alertOutput.subscribe(resp => {
    this.logger.error("Child component\'s event was triggered"+ resp.data);
    this.alertResponse(resp.data)
 });


  } 

 alertResponse(resp) {
    switch (resp) {
      case 0: //Delete message cancel
        // this.saveStatus = "Cancel";
        break;
      case 1: //Delete message Yes
        break;
      case 100: //Send an email 'Yes' response
        break;
      case 101: //Send an email 'No' response.
        break;
    }
  }
  // private findAssignment(assignment) {
     
  // }


  // private existsInList(item:any, list : Array<any>, fieldName : string) : boolean {
  //   list.forEach( e => {
  //     if(item[fieldName] === e[fieldName]) {
  //       return true;
  //     }
  //   });
  //   return false;
  // }
  private actionCancel() {
    // this.logger.log("canceling assignment ...");
     this.router.navigate(['amh-routing']);
     //this._sharedAMHRoutingOverview.clearAll();
     this._sharedAMHRule.clearAll();
     //this.router.parent.navigate([, this.returnParameters]);
   }

   updateScroll(){
    this._sharedAMHRoutingOverview.setBodyScrollTop(document.body.scrollTop);
    this._sharedAMHRoutingOverview.setDocumentElementScrollTop(document.documentElement.scrollTop);
  }

  clearSearchInput(){
    this.searchInput.setValue("");
  }

  selectSelectionGroup(selectionGroup){
    this.selectedSelectionGroup = selectionGroup;
    if(!this.selectedSelectionGroup)
      this.searchSelectionGroup = ""
    /*
    if(this.selectedSelectionGroup!="" && this.selectedSelectionGroup!=undefined && this.selectedSelectionGroup!=null)
      this.data = this.original.filter(_=> _.selectionGroup == this.selectedSelectionGroup)
    else
      this.data= this.original
      */
    //this._sharedAMHRoutingOverview.setSelectionGroup(this.selectedSelectionGroup)
    this.searchInput.setValue(this.searchInput.value);
  }

  showSelectionGroup(): boolean{
    return (this.defaultOption.id == 2 && this.dcstSelectionGroup) || (this.defaultOption.id == 4 && this.fbdcstSelectionGroup);
  }

  actionDelete(item){
    this.alertYesCancel(1,0,"This action will delete the assignment " + item.code + ". Are you sure you want to delete it? ", item.code);
  }

  delete(code: string){
    this.log = new ApplicationLog("AMH","",new Date(),this.auth.getUser().username,"amh.modify.assignment","AMH Assignment")
    this.log.extrInfo = "Delete Assignment - Type: " + this.defaultOption.code + " - Code: " + code + "."
    this.amhAssignmentService.deleteAssignmentByCode(this.defaultOption.id,code).subscribe(
      data=> {
        this.logger.debug("delete " + data +" rules!")
        this.log.succeed();
      },
      error=> {
        this.logger.error("Error: " + error)
        this.log.fail();
        this.log.extrInfo += " Error: " + error.message + "." 
      },
      ()=> this.searchInput.setValue(this.searchInput.value)
    ).add(()=>{
      this.applicationLogService.saveApplicationLog(this.log);
    });
  }

  private alertYesCancel(yesResponse: number, cancelResponse: number, message: string, code?: string) {
    // this.alert.waitIcon = false;
    // this.alert.alertFooter = true;
    // this.alert.cancelButton = true;
    // this.alert.cancelButtonText = "Cancel";
    // this.alert.cancelButtonResponse = cancelResponse;
    // this.alert.yesButton = true;
    // this.alert.yesButtonText = yesLabel || "Yes";
    // this.alert.yesButtonResponse = yesResponse;
    // this.alert.okButton = false;
    // this.alert.alertHeader = true;
    // this.alert.alertTitle = " Alert ";
    // this.alert.message = message;
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
      message: message,
    // this.alert.open();
      isOpen: true
      }
    });

    this.bsAlertRef.content.alertOutput.subscribe(resp => {
      this.logger.error("Child component\'s event was triggered"+ resp.data);
      this.actionAlertResponse(resp.data, code)
    });
  }

  actionAlertResponse(response: number, code?: string) {
    switch (response) {
      case 0: //Delete Rule cancel
        // this.saveStatus = "Cancel";
        break;
      case 1: //Delete Rule Yes
        this.delete(code);
        break;

    }
  }
}
