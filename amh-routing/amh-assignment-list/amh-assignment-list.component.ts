import { Component, OnInit, Input, ViewChild, HostListener, ElementRef, Injectable } from '@angular/core';
import { Option } from '../../models/referential/option/option.model';
import { AssignType, AssignmentList } from '../../models/routing-amh';
import { ActivatedRoute, Router } from '@angular/router';
import { LogService, AuthService, Parameter, ApplicationLogService } from '../../common/components/services';
import { AmhAssignmentService } from '../amh-service';
//import { BootstrapPaginator, DataTable, DataEvent, PageEvent, SortEvent, DefaultSorter, Paginator} from '../../common/components/ui/widgets/general-datatable';
import { MenuConfig } from '../../models/menu/menu-config';
import { ApplicationLog } from '../../models/applicationLog'
import { BootstrapPaginatorOverview, DataTableOverview, DataEventOverview, PageEventOverview, SortEventOverview, DefaultSorterOverview, PaginatorOverview  } from '../../common/components/ui/widgets/overview-datatable';
import { FormControl, FormGroup } from '@angular/forms';
import { SharedAMHRoutingOverview, SharedAMHRule } from '../../common/components/shared-services'
import { Observable } from 'rxjs';
import { debounceTime, switchMap, combineLatest } from 'rxjs/operators';
import { jqxGridComponent } from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxgrid';
import { jqxDropDownListComponent } from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxdropdownlist';
import { jqxInputComponent } from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxinput';
import { jqxWindowComponent } from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow';
import { jqxMenuComponent } from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxmenu';
import { Angular5Csv } from 'angular5-csv/Angular5-csv';


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

  `],
  templateUrl: './amh-assignment-list.component.html'
})

@Injectable()
export class AmhAssignmentListComponent implements OnInit {

    @HostListener('window:mouseup', ['$event'])
    keyEvent1(event: KeyboardEvent) {
        this.assignToEdit = []
        if(this.amhAssignListGrid.getselectedrowindexes().length != 0 && !(this.amhAssignListGrid.getselectedrowindexes().length == 1 && this.amhAssignListGrid.getselectedrowindexes()[0]==-1)){
            this.amhAssignListGrid.getselectedrowindexes().map(rowindex =>{
                if (!this.assignToEdit.includes(this.amhAssignListGrid.getrowdata(rowindex).code))
                    this.assignToEdit.push(this.amhAssignListGrid.getrowdata(rowindex).code)
            })
        }

        if(this.assignToEdit.length == 1){
            document.getElementById("editButton").classList.remove("jqx-fill-state-disabled");
            document.getElementById("cloneButton").classList.remove("jqx-fill-state-disabled");
        }else{
            if (!document.getElementById("editButton").classList.contains("jqx-fill-state-disabled")){
                document.getElementById("editButton").classList.add("jqx-fill-state-disabled")
            }
            if (!document.getElementById("cloneButton").classList.contains("jqx-fill-state-disabled")){
                document.getElementById("cloneButton").classList.add("jqx-fill-state-disabled")
            }
        }

        if(this.amhAssignListGrid.selectedrowindexes().length == 0){
            if (!document.getElementById("deleteButton").classList.contains("jqx-fill-state-disabled")){
                document.getElementById("deleteButton").classList.add("jqx-fill-state-disabled")
            }
        }else{
            document.getElementById("deleteButton").classList.remove("jqx-fill-state-disabled")
        }
    }

    @HostListener('window:click', ['$event'])
    keyEvent2(event: KeyboardEvent) {
        if(event.srcElement.classList.contains("image-pointer")){
            this.findWindow.destroy();
            this.loadingWindow.destroy();
        }
        if(event.srcElement.classList.contains("editRuleCell")  && this.auth.hasPermission(["amh.modify.rule"])){
            this._sharedAMHRule.updateCode(event.srcElement.textContent);
            this.saveGridinfo();
            this.router.navigate(['amh-routing/rule/edit'], {queryParams:{ 'return_to':'assignment-list', 'code':event.srcElement.textContent,'st':this.defaultOption.id}})
        }
        if(event.srcElement.classList.contains("editAssignCell")  && this.auth.hasPermission(["amh.modify.assignment"])){
            this.saveGridinfo();
            this.router.navigate(['amh-routing/assignment/edit'],{queryParams: { 'code': event.srcElement.textContent, 'st': this.defaultOption.id,'return_to':'assignment-list'}})
        }

    }

    @HostListener('window:keyup', ['$event'])
    keyEvent3(event: KeyboardEvent) {
      if(event.keyCode == 37){
        this.amhAssignListGrid.gotoprevpage()
      }
      if(event.keyCode == 39){
        this.amhAssignListGrid.gotonextpage()
      }
      if((event.keyCode==(38 || 40)) || event.shiftKey){
        this.assignToEdit = []
        if(this.amhAssignListGrid.getselectedrowindexes().length != 0 && !(this.amhAssignListGrid.getselectedrowindexes().length == 1 && this.amhAssignListGrid.getselectedrowindexes()[0]==-1)){
            this.amhAssignListGrid.getselectedrowindexes().map(rowindex =>{
                if (!this.assignToEdit.includes(this.amhAssignListGrid.getrowdata(rowindex).code))
                    this.assignToEdit.push(this.amhAssignListGrid.getrowdata(rowindex).code)
            })
        }

        if(this.assignToEdit.length == 1){
            document.getElementById("editButton").classList.remove("jqx-fill-state-disabled");
            document.getElementById("cloneButton").classList.remove("jqx-fill-state-disabled");
        }else{
            if (!document.getElementById("editButton").classList.contains("jqx-fill-state-disabled")){
                document.getElementById("editButton").classList.add("jqx-fill-state-disabled")
            }
            if (!document.getElementById("cloneButton").classList.contains("jqx-fill-state-disabled")){
                document.getElementById("cloneButton").classList.add("jqx-fill-state-disabled")
            }
        }

        if(this.amhAssignListGrid.selectedrowindexes().length == 0){
            if (!document.getElementById("deleteButton").classList.contains("jqx-fill-state-disabled")){
                document.getElementById("deleteButton").classList.add("jqx-fill-state-disabled")
            }
        }else{
            document.getElementById("deleteButton").classList.remove("jqx-fill-state-disabled")
        }
      }
    }

    @ViewChild('amhAssignListGrid') amhAssignListGrid: jqxGridComponent;
    @ViewChild('gridMenu') gridMenu: jqxMenuComponent;
    @ViewChild('findWindowDropDownList') findWindowDropDownList: jqxDropDownListComponent;
    @ViewChild('findWindowInput') findWindowInput: jqxInputComponent;
    @ViewChild('findWindow') findWindow: jqxWindowComponent;
    @ViewChild('loadingWindow') loadingWindow: jqxWindowComponent;
    

    private defaultOption :Option = new Option(AssignType.BK_CHANNEL,"BK_CH","Backend Selection");
    private selectionTables : Array<Option> = [
        new Option(AssignType.BK_CHANNEL,"BK_CH","Backend Selection"),
        new Option(AssignType.DTN_COPY,"DTN_CPY","Distribution Copy Selection Table"),
        new Option(AssignType.FEED_DTN_COPY,"FEED_DTN_CPY","Feedback Distribution Copy Selection Table")
      ];

    private menuConfig : Array<MenuConfig> = [
        new MenuConfig("fa fa-home","/home","Home"),
        new MenuConfig("fa fa-university","/amh-routing","AMH Routing"),
        new MenuConfig("fa fa-list","","Routing Overview")
    ];

    private dcstSelectionGroup: boolean = false;
    private fbdcstSelectionGroup: boolean = false;
    
    private selectionGroups: Array<string> = [];
    private assignToEdit: Array<any> = [];
    private assignsToDelete: Array<any> = [];
    private data: Array<AssignmentList> = [];
    private dataSource: Array<Array<any>> = [];
    private log: ApplicationLog;
    private status: string = "init";
    private clipboard: string = "";
    
    
    private getdropdownSource = ():string[] =>{
        if(this.defaultOption.id == 2 && this.dcstSelectionGroup){
            return  ['Selection Group', 'Active', 'Selection Seq', 'Selection Code', 'Backend Channel', 'Stop Flag', 'Rule Seq', 'Rule Code', 'Rule Expression'];
        }else if(this.defaultOption.id == 2 && !this.dcstSelectionGroup){
            return  ['Active', 'Selection Seq', 'Selection Code', 'Backend Channel', 'Stop Flag', 'Rule Seq', 'Rule Code', 'Rule Expression'];
        }else if(this.defaultOption.id == 4 && this.fbdcstSelectionGroup){
            return  ['Selection Group', 'Active', 'Selection Seq', 'Selection Code', 'Backend Channel', 'Rule Seq', 'Rule Code', 'Rule Expression'];
        }else{
            return  ['Active', 'Selection Seq', 'Selection Code', 'Backend Channel', 'Rule Seq', 'Rule Code', 'Rule Expression'];
        }
    }
    private dropDownSource: string[] = this.getdropdownSource()

    
    private getDataFields = () =>{
        if(this.defaultOption.id == 2 && this.dcstSelectionGroup){
            return  [
                { name: 'selectionGroup', type: 'string', map: '0' },
                { name: 'active', type: 'bool', map: '1' },
                { name: 'backSequence', type: 'int', map: '2' },
                { name: 'code', type: 'string', map: '3' },
                { name: 'backCode', type: 'string', map: '4' },
                { name: 'stopFlag', type: 'bool', map: '5' },
                { name: 'ruleSequence', type: 'int', map: '6' },
                { name: 'ruleCode', type: 'string', map: '7' },
                { name: 'ruleExpressions', type: 'string', map: '8' }
            ];
        }else if(this.defaultOption.id == 2 && !this.dcstSelectionGroup){
            return  [
                { name: 'active', type: 'bool', map: '0' },
                { name: 'backSequence', type: 'int', map: '1' },
                { name: 'code', type: 'string', map: '2' },
                { name: 'backCode', type: 'string', map: '3' },
                { name: 'stopFlag', type: 'bool', map: '4' },
                { name: 'ruleSequence', type: 'int', map: '5' },
                { name: 'ruleCode', type: 'string', map: '6' },
                { name: 'ruleExpressions', type: 'string', map: '7' }
            ];
        }else if(this.defaultOption.id == 4 && this.fbdcstSelectionGroup){
            return  [
                { name: 'selectionGroup', type: 'string', map: '0' },
                { name: 'active', type: 'bool', map: '1' },
                { name: 'backSequence', type: 'int', map: '2' },
                { name: 'code', type: 'string', map: '3' },
                { name: 'backCode', type: 'string', map: '4' },
                { name: 'ruleSequence', type: 'int', map: '5' },
                { name: 'ruleCode', type: 'string', map: '6' },
                { name: 'ruleExpressions', type: 'string', map: '7' }
            ];
        }else{
            return  [
                { name: 'active', type: 'bool', map: '0' },
                { name: 'backSequence', type: 'int', map: '1' },
                { name: 'code', type: 'string', map: '2' },
                { name: 'backCode', type: 'string', map: '3' },
                { name: 'ruleSequence', type: 'int', map: '4' },
                { name: 'ruleCode', type: 'string', map: '5' },
                { name: 'ruleExpressions', type: 'string', map: '6' }
            ];
        }
    }

    private dataFields = this.getDataFields();

    private getSource= ():any =>{
        return {
            localdata: this.dataSource,
            datafields: this.dataFields,
            datatype: 'array',
            pagesize: 10
        }
    };
  
    private source = this.getSource();


    private getAdapter  = (): any => {
        let source: any = this.getSource()
        let dataAdapter: any = new jqx.dataAdapter(source);
        return dataAdapter;
    }
    private dataAdapter = this.getAdapter();

    private getColumns = () =>{
        if(this.defaultOption.id == 2 && this.dcstSelectionGroup){
            return [
                { text: 'Selection Group', datafield: 'selectionGroup', width: '9%',
                    filtertype: 'custom',
                    createfilterpanel: (datafield: string, filterPanel: any): void => {
                        this.buildFilterPanel(filterPanel, datafield);
                    },
                    cellsrenderer: function (row, colum, value) {
                        let cell = '<div class="jqx-grid-cell-left-align selectionGroup" style="width:95%;position: absolute; top: 50%; transform: translateY(-50%); word-wrap:break-word;">'+ value +'</div>'
                        return cell;
                    }
                },
                { text: 'Active', datafield: 'active', width: '4%', filtertype: 'checkedlist',
                    cellsrenderer: function (row, colum, value) {
                        let cell =''
                        if(value)
                            cell = '<div style="width:100%; text-align:center; margin: 0; position: absolute; top: 50%; -ms-transform: translateY(-50%); transform: translateY(-50%);"><span class="badge bg-primary"><i class="fa fa-check" aria-hidden="true"></i></span></div>'
                        else
                            cell = '<div style="width:100%; text-align:center; margin: 0; position: absolute; top: 50%; -ms-transform: translateY(-50%); transform: translateY(-50%);"><span class="badge bg-danger"><i class="fa fa-times" aria-hidden="true"></i></span></div>'
                        return cell;
                    }
                },
                { text: 'Selection Seq', datafield: 'backSequence', width: '4%' },
                { text: 'Selection Code', datafield: 'code', width: '13%',
                    cellsrenderer: function (row, colum, value) {
                        let cell = '<div class="jqx-grid-cell-left-align code editAssignCell" style="width:95%;width:100%;position: absolute; top:50%; transform: translateY(-50%); word-wrap:break-word;">'+ value +'</div>'
                        return cell;
                    }
                },
                { text: 'Backend Channel', datafield: 'backCode', width: '9%',
                    cellsrenderer: function (row, colum, value) {
                        value = value.replace(/\n/g,"<br>")
                        let cell = '<div class="jqx-grid-cell-left-align backCode" style="width:95%;position: absolute; top: 50%; -ms-transform: translateY(-50%); transform: translateY(-50%); word-wrap:break-word;">'+value+'</div>'
                        return cell;
                    }
                },
                { text: 'Stop Flag', datafield: 'stopFlag', width: '4%', filtertype: 'checkedlist',
                    cellsrenderer: function (row, colum, value) {
                        let cell =''
                        if(value)
                            cell = '<div style="width:100%; text-align:center; margin: 0; position: absolute; top: 50%; -ms-transform: translateY(-50%); transform: translateY(-50%); word-wrap:break-word;"><i class="far fa-stop-circle fa-2x" style="color:red;"></i></span></div>'
                        return cell;
                    }
                },
                { text: 'Rule Seq', datafield: 'ruleSequence', width: '4%'},
                { text: 'Rule Code', datafield: 'ruleCode', width: '13%',
                    cellsrenderer: function (row, colum, value) {
                        let cell = '<div class="jqx-grid-cell-left-align editRuleCell ruleCode" style="width:95%;position: absolute; top: 50%; -ms-transform: translateY(-50%); transform: translateY(-50%); word-wrap:break-word;">'+ value +'</div>'
                        return cell;
                    }
                },
                { text: 'Rule Expressions', datafield: 'ruleExpressions', width: '40%' ,
                    cellsrenderer: function (row, colum, value) {
                        let cell = '<div class="jqx-grid-cell-left-align ruleExpressions" style="width:95%;position: absolute; top:50%; transform: translateY(-50%); word-wrap:break-word;">'+ value +'</div>'
                        return cell;
                    }
                }
            ];
        }else if(this.defaultOption.id == 2 && !this.dcstSelectionGroup){
            return [
                { text: 'Active', datafield: 'active', width: '5%', filtertype: 'checkedlist',
                    cellsrenderer: function (row, colum, value) {
                        let cell =''
                        if(value)
                            cell = '<div style="width:100%; text-align:center; margin: 0; position: absolute; top: 50%; -ms-transform: translateY(-50%); transform: translateY(-50%);"><span class="badge bg-primary"><i class="fa fa-check" aria-hidden="true"></i></span></div>'
                        else
                            cell = '<div style="width:100%; text-align:center; margin: 0; position: absolute; top: 50%; -ms-transform: translateY(-50%); transform: translateY(-50%);"><span class="badge bg-danger"><i class="fa fa-times" aria-hidden="true"></i></span></div>'
                        return cell;
                    }
                },
                { text: 'Selection Seq', datafield: 'backSequence', width: '5%' },
                { text: 'Selection Code', datafield: 'code', width: '15%',
                    cellsrenderer: function (row, colum, value) {
                        let cell = '<div class="jqx-grid-cell-left-align code editAssignCell" style="width:95%;position: absolute; top:50%; transform: translateY(-50%); word-wrap:break-word;">'+ value +'</div>'
                        return cell;
                    }
                },
                { text: 'Backend Channel', datafield: 'backCode', width: '10%',
                    cellsrenderer: function (row, colum, value) {
                        let cell = '<div class="jqx-grid-cell-left-align backCode" style="width:95%;position: absolute; top:50%; transform: translateY(-50%); word-wrap:break-word;">'+ value +'</div>'
                        return cell;
                    }
                },
                { text: 'Stop Flag', datafield: 'stopFlag', width: '5%', filtertype: 'checkedlist',
                    cellsrenderer: function (row, colum, value) {
                        let cell =''
                        if(value)
                            cell = '<div style="width:100%; text-align:center; margin: 0; position: absolute; top: 50%; -ms-transform: translateY(-50%); transform: translateY(-50%);"><i class="far fa-stop-circle fa-2x" style="color:red;"></i></span></div>'
                        return cell;
                    }
                },
                { text: 'Rule Seq', datafield: 'ruleSequence', width: '5%'},
                { text: 'Rule Code', datafield: 'ruleCode', width: '15%',
                    cellsrenderer: function (row, colum, value) {
                        let cell = '<div class="jqx-grid-cell-left-align editRuleCell ruleCode" style="width:95%;position: absolute; top: 50%; -ms-transform: translateY(-50%); transform: translateY(-50%); word-wrap:break-word;">'+ value +'</div>'
                        return cell;
                    }
                },
                { text: 'Rule Expressions', datafield: 'ruleExpressions', width: '40%' ,
                cellsrenderer: function (row, colum, value) {
                    let cell = '<div class="jqx-grid-cell-left-align ruleExpressions" style="width:95%;position: absolute; top:50%; transform: translateY(-50%); word-wrap:break-word;">'+ value +'</div>'
                    return cell;
                }}
            ];
        }else if(this.defaultOption.id == 4 && this.fbdcstSelectionGroup){
            return [
                { text: 'Selection Group', datafield: 'selectionGroup', width: '9%',
                    filtertype: 'custom',
                    createfilterpanel: (datafield: string, filterPanel: any): void => {
                        this.buildFilterPanel(filterPanel, datafield);
                    },
                    cellsrenderer: function (row, colum, value) {
                        let cell = '<div class="jqx-grid-cell-left-align selectionGroup" style="width:95%;position: absolute; top: 50%; transform: translateY(-50%); word-wrap:break-word;">'+ value +'</div>'
                        return cell;
                    }
                },
                { text: 'Active', datafield: 'active', width: '4%', filtertype: 'checkedlist',
                    cellsrenderer: function (row, colum, value) {
                        let cell =''
                        if(value)
                            cell = '<div style="width:100%; text-align:center; margin: 0; position: absolute; top: 50%; -ms-transform: translateY(-50%); transform: translateY(-50%);"><span class="badge bg-primary"><i class="fa fa-check" aria-hidden="true"></i></span></div>'
                        else
                            cell = '<div style="width:100%; text-align:center; margin: 0; position: absolute; top: 50%; -ms-transform: translateY(-50%); transform: translateY(-50%);"><span class="badge bg-danger"><i class="fa fa-times" aria-hidden="true"></i></span></div>'
                        return cell;
                    }
                },
                { text: 'Selection Seq', datafield: 'backSequence', width: '4%' },
                { text: 'Selection Code', datafield: 'code', width: '14%',
                    cellsrenderer: function (row, colum, value) {
                        let cell = '<div class="jqx-grid-cell-left-align code editAssignCell" style="width:95%;position: absolute; top:50%; transform: translateY(-50%); word-wrap:break-word;">'+ value +'</div>'
                        return cell;
                    }
                },
                { text: 'Backend Channel', datafield: 'backCode', width: '9%',
                    cellsrenderer: function (row, colum, value) {
                        let cell = '<div class="jqx-grid-cell-left-align backCode" style="width:95%;position: absolute; top:50%; transform: translateY(-50%); word-wrap:break-word;">'+ value +'</div>'
                        return cell;
                    }
                },
                { text: 'Rule Seq', datafield: 'ruleSequence', width: '4%'},
                { text: 'Rule Code', datafield: 'ruleCode', width: '14%',
                    cellsrenderer: function (row, colum, value) {
                        let cell = '<div class="jqx-grid-cell-left-align editRuleCell ruleCode" style="width:95%;position: absolute; top: 50%; transform: translateY(-50%); word-wrap:break-word;">'+ value +'</div>'
                        return cell;
                    }
                },
                { text: 'Rule Expressions', datafield: 'ruleExpressions', width: '42%',
                    cellsrenderer: function (row, colum, value) {
                        let cell = '<div class="jqx-grid-cell-left-align ruleExpressions" style="width:95%;position: absolute; top:50%; transform: translateY(-50%); word-wrap:break-word;">'+ value +'</div>'
                        return cell;
                    }
                }
            ];
        }else{
            return [
                { text: 'Active', datafield: 'active', width: '5%', filtertype: 'checkedlist',
                    cellsrenderer: function (row, colum, value) {
                        let cell =''
                        if(value)
                            cell = '<div style="width:100%; text-align:center; margin: 0; position: absolute; top: 50%; -ms-transform: translateY(-50%); transform: translateY(-50%);"><span class="badge bg-primary"><i class="fa fa-check" aria-hidden="true"></i></span></div>'
                        else
                            cell = '<div style="width:100%; text-align:center; margin: 0; position: absolute; top: 50%; -ms-transform: translateY(-50%); transform: translateY(-50%);"><span class="badge bg-danger"><i class="fa fa-times" aria-hidden="true"></i></span></div>'
                        return cell;
                    }
                },
                { text: 'Selection Seq', datafield: 'backSequence', width: '5%' },
                { text: 'Selection Code', datafield: 'code', width: '15%',
                    cellsrenderer: function (row, colum, value) {
                        let cell = '<div class="jqx-grid-cell-left-align code editAssignCell" style="width:95%;position: absolute; top:50%; transform: translateY(-50%) ;word-wrap:break-word;">'+ value +'</div>'
                        return cell;
                    }
                },
                { text: 'Backend Channel', datafield: 'backCode', width: '10%',
                    cellsrenderer: function (row, colum, value) {
                        let cell = '<div class="jqx-grid-cell-left-align backCode" style="width:95%;position: absolute; top:50%; transform: translateY(-50%) ;word-wrap:break-word;">'+ value +'</div>'
                        return cell;
                    }
                },
                { text: 'Rule Seq', datafield: 'ruleSequence', width: '5%'},
                { text: 'Rule Code', datafield: 'ruleCode', width: '15%',
                    cellsrenderer: function (row, colum, value) {
                        let cell = '<div class="jqx-grid-cell-left-align editRuleCell ruleCode" style="width:95%;position: absolute; top: 50%; transform: translateY(-50%); word-wrap:break-word;">'+ value +'</div>'
                        return cell;
                    }
                },
                { text: 'Rule Expressions', datafield: 'ruleExpressions', width: '45%',
                    cellsrenderer: function (row, colum, value) {
                        let cell = '<div class="jqx-grid-cell-left-align ruleExpressions" style="width:95%;position: absolute; top:50%; transform: translateY(-50%); word-wrap:break-word;">'+ value +'</div>'
                        return cell;
                    }
                }
            ];
        }
    }

    private columns = this.getColumns();


    buildFilterPanel = (filterPanel: any, datafield: string): void => {
        let inputContainer = document.createElement('div');
        inputContainer.id = 'inputContainer';
        inputContainer.style.margin = '5px';
        let buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'filter';
        Object.assign(buttonsContainer.style, { height: '50px', marginLeft: '5px', marginTop: '7px' })
        let emptyButtonContainer = document.createElement('div');
        let filterButtonContainer = document.createElement('div');
        let filterClearButtonContainer = document.createElement('div');
        emptyButtonContainer.style.cssText = 'margin-left: 16px; float: left';
        filterButtonContainer.style.cssText = 'margin-left: 16px; float: left';
        filterClearButtonContainer.style.cssText = 'margin-left: 12px; float: left';
        emptyButtonContainer.id = 'emptyButtonContainer';
        filterButtonContainer.id = 'filterButtonContainer';
        filterClearButtonContainer.id = 'filterClearButtonContainer';
        buttonsContainer.appendChild(emptyButtonContainer);
        buttonsContainer.appendChild(filterButtonContainer);
        buttonsContainer.appendChild(filterClearButtonContainer);
        filterPanel[0].appendChild(inputContainer);
        filterPanel[0].appendChild(buttonsContainer);
        let emptyButtonOptions = { width: 50, height: 25, value: 'Empty', textPosition: 'center'};
        let emptyButton = jqwidgets.createInstance('#emptyButtonContainer', 'jqxButton', emptyButtonOptions);
        let filterButtonOptions = { width: 45, height: 25, value: 'Filter', textPosition: 'center'};
        let filterButton = jqwidgets.createInstance('#filterButtonContainer', 'jqxButton', filterButtonOptions);
        let filterClearButtonOptions = { width: 45, height: 25, value: 'Clear', textPosition: 'center'};
        let filterClearButton = jqwidgets.createInstance('#filterClearButtonContainer', 'jqxButton', filterClearButtonOptions);
        let column = this.amhAssignListGrid.getcolumn(datafield);
        let inputOptions = {
            width: 215, height: 20, source: this.selectionGroups,
            placeHolder: `Enter ${column.text}`,
            searchMode: "contains",
            autoComplete: false,
            dropDownVerticalAlignment: 'top',
            dropDownHeight: 120
        };
        let input = jqwidgets.createInstance('#inputContainer', 'jqxComboBox', inputOptions);
        emptyButton.addEventHandler('click', () => {
            let filtergroup = new jqx.filter();
            let filter_or_operator = 1;
            let filtercondition = 'empty';
            let filter1 = filtergroup.createfilter('stringfilter', "", filtercondition);
            filtergroup.addfilter(filter_or_operator, filter1);
            // add the filters.
            this.amhAssignListGrid.removefilter(datafield, false);
            this.amhAssignListGrid.addfilter(datafield, filtergroup);
            // apply the filters.
            this.amhAssignListGrid.applyfilters();
            this.amhAssignListGrid.closemenu();
        });
        filterButton.addEventHandler('click', () => {
            let filtergroup = new jqx.filter();
            let filter_or_operator = 1;
            //let filtervalue = input.val();
            let filtervalue = document.getElementById("inputContainer").children[1]["value"];
            let filtercondition = 'CONTAINS_CASE_SENSITIVE';
            let filter1 = filtergroup.createfilter('stringfilter', filtervalue, filtercondition);
            filtergroup.addfilter(filter_or_operator, filter1);
            this.amhAssignListGrid.removefilter(datafield, false);
            // add the filters.
            this.amhAssignListGrid.addfilter(datafield, filtergroup);
            // apply the filters.
            this.amhAssignListGrid.applyfilters();
            this.amhAssignListGrid.closemenu();
        });
        filterClearButton.addEventHandler('click', () => {
            this.amhAssignListGrid.removefilter(datafield, false);
            // apply the filters.
            this.amhAssignListGrid.applyfilters();
            this.amhAssignListGrid.closemenu();
        });
      }
    columnmenuopening = (menu: any, datafield: any, height: any): void => {
        let column: any = this.amhAssignListGrid.getcolumn(datafield);
        if (column.filtertype === 'custom') {
            menu.height(200);
            setTimeout(() => {
                menu.find('input').focus();
            }, 25);
        }
        else{ 
            menu.height(height);
        }
    };

  constructor(private activatedRouter: ActivatedRoute, private amhAssignmentService: AmhAssignmentService,
     private auth: AuthService, private logger : LogService, private router: Router, private parameter: Parameter, private applicationLogService: ApplicationLogService,
     private _sharedAMHRoutingOverview: SharedAMHRoutingOverview, private _sharedAMHRule: SharedAMHRule) {

    this.defaultOption = this.selectedAssignmentType(_sharedAMHRoutingOverview.getAssignmentType());


    }

    ngOnInit(){

        Observable.combineLatest(this.parameter.getParameter("AMH_DCST_SG"), this.parameter.getParameter("AMH_FBDCST_SG")).subscribe(
            ([data1,data2])=>{
                if(data1["parameter"]){
                    if(data1["parameter"]["keyValue"] == "ENABLE")
                        this.dcstSelectionGroup = true;
                }
                if(data2["parameter"]){
                    if(data2["parameter"]["keyValue"] == "ENABLE")
                        this.fbdcstSelectionGroup = true;
                }
            },
            error =>{
                this.router.navigateByUrl('/error')
            }
        ).add(()=>{
            this.amhAssignmentService.findAssignments(this.defaultOption.id).subscribe(
                data=>{
                    this.data = [];
                    let resp = AmhAssignmentService.getFromSource(data);
                    resp.map(assign => {
                         this.data = this.data.concat(this.fromJsonToAssignList(this.defaultOption.id, assign));
                    });
                    this.dataSource = [];
                    this.selectionGroups = [];
                    this.data.map(assign=>{
                        this.dataSource.push(this.assignToArrayString(assign));
                        if(assign.selectionGroup){
                            if (!this.selectionGroups.includes(assign.selectionGroup))
                                this.selectionGroups.push(assign.selectionGroup);
                        }
                    })
                    this.selectionGroups.sort();
                    this.dataFields = this.getDataFields();
                    this.amhAssignListGrid.columns(this.getColumns());
                    this.amhAssignListGrid.source(this.getAdapter());
                    this.amhAssignListGrid.pagesizeoptions([10,50,100]);
    
                    if(this._sharedAMHRoutingOverview.getAssignmentType()!=undefined){
                        if(this._sharedAMHRoutingOverview.getFilterInformation() && this._sharedAMHRoutingOverview.getFilterInformation().length>0){
                            this._sharedAMHRoutingOverview.getFilterInformation().map(filter=>{
                                this.amhAssignListGrid.addfilter(filter.datafield,filter.filter)
                                this.amhAssignListGrid.applyfilters()
                            })
                        }
                        if(this._sharedAMHRoutingOverview.getSortInformation().sortcolumn){
                            this.amhAssignListGrid.sortby(this._sharedAMHRoutingOverview.getSortInformation().sortcolumn,this._sharedAMHRoutingOverview.getSortInformation().sortdirection.ascending?"ascending":"descending");
                        }
                        this.amhAssignListGrid.pagesize(this._sharedAMHRoutingOverview.getPagingInformation().pagesize)
                        this.amhAssignListGrid.gotopage(this._sharedAMHRoutingOverview.getPagingInformation().pagenum)
                        this.amhAssignListGrid.groups(this._sharedAMHRoutingOverview.getGroupInformation())
                    }
                },
                err=>{
                    this.logger.error("Can't get assignments. Error code: %s, URL: %s ", err.status, err.url)
                }
            )
        })
    }

    ngAfterViewInit(): void {
        this.createButtons();
    }

    ngOnDestroy(){
        this.findWindowDropDownList.destroy();
        this.findWindowInput.destroy();
        this.findWindow.destroy();
        this.loadingWindow.destroy();
        this.amhAssignListGrid.destroy();
    }

    createButtonsContainers(statusbar: any): void {
        let buttonsContainer = document.createElement('div');
        buttonsContainer.style.cssText = 'overflow: hidden; position: relative; margin: 5px;';
        let addButtonContainer = document.createElement('div');
        let editButtonContainer = document.createElement('div');
        let cloneButtonContainer = document.createElement('div');
        let deleteButtonContainer = document.createElement('div');
        let reloadButtonContainer = document.createElement('div');
        let searchButtonContainer = document.createElement('div');
        let fullExportButtonContainer = document.createElement('div');
        let partialExportButtonContainer = document.createElement('div');
        addButtonContainer.id = 'addButton';
        editButtonContainer.id = 'editButton';
        cloneButtonContainer.id = 'cloneButton';
        deleteButtonContainer.id = 'deleteButton';
        reloadButtonContainer.id = 'reloadButton';
        searchButtonContainer.id = 'searchButton';
        fullExportButtonContainer.id = 'fullExportButton';
        partialExportButtonContainer.id = 'partialExportButton';
        reloadButtonContainer.style.cssText = 'float: left; margin-left: 5px;';
        searchButtonContainer.style.cssText = 'float: left; margin-left: 5px;';
        fullExportButtonContainer.style.cssText = 'float: right; margin-left: 5px;';
        partialExportButtonContainer.style.cssText = 'float: right; margin-left: 5px;';
        addButtonContainer.style.cssText = 'float: left; margin-left: 5px;';
        editButtonContainer.style.cssText = 'float: left; margin-left: 5px;';
        cloneButtonContainer.style.cssText = 'float: left; margin-left: 5px;';
        deleteButtonContainer.style.cssText = 'float: left; margin-left: 5px;';
        buttonsContainer.appendChild(addButtonContainer);   
        buttonsContainer.appendChild(editButtonContainer);
        buttonsContainer.appendChild(cloneButtonContainer);
        buttonsContainer.appendChild(deleteButtonContainer);
        buttonsContainer.appendChild(reloadButtonContainer);
        buttonsContainer.appendChild(searchButtonContainer);
        buttonsContainer.appendChild(fullExportButtonContainer);
        buttonsContainer.appendChild(partialExportButtonContainer);
        
        statusbar[0].appendChild(buttonsContainer);
    }

    createButtons(): void {
        if(this.auth.hasPermission(['amh.modify.assignment'])){
            let addButtonOptions = {
                width: 80, height: 25, value: '<i class="fas fa-plus-circle fa-lg" style="color: green"></i> Add',
                textPosition: 'center'
            }
            let addButton = jqwidgets.createInstance('#addButton', 'jqxButton', addButtonOptions);
            let editButtonOptions = {
                width: 80, height: 25, value: '<i class="fas fa-edit fa-lg" style="color: green"></i> Edit',
                textPosition: 'center', disabled: true
            }
            let editButton = jqwidgets.createInstance('#editButton', 'jqxButton', editButtonOptions);
            let cloneButtonOptions = {
                width: 80, height: 25, value: '<i class="far fa-clone fa-lg" style="color: black"></i> Clone',
                textPosition: 'center', disabled: true
            }
            let cloneButton = jqwidgets.createInstance('#cloneButton', 'jqxButton', cloneButtonOptions);
            let deleteButtonOptions = {
                width: 80, height: 25, value: '<i class="fas fa-times-circle fa-lg" style="color: #FF3737"></i> Delete',
                textPosition: 'center', disabled: true
            }
            let deleteButton = jqwidgets.createInstance('#deleteButton', 'jqxButton', deleteButtonOptions);

            // add new row.
            addButton.addEventHandler('click', (event: any): void => {
                this.saveGridinfo();
                this.router.navigate(['amh-routing/assignment/create'],{queryParams: {'st':this.defaultOption.id,'return_to':'assignment-list'}});
            });
            // edit selected row.
            editButton.addEventHandler('click', (event: any): void => {
                if (!document.getElementById("editButton").classList.contains("jqx-fill-state-disabled")){
                    this.saveGridinfo();
                    let rowData = this.amhAssignListGrid.getrowdata(this.amhAssignListGrid.selectedrowindex());
                    this.router.navigate(['amh-routing/assignment/edit'],{queryParams: { 'code': rowData.code, 'st': this.defaultOption.id,'return_to':'assignment-list'}})
                }
            });
            cloneButton.addEventHandler('click', (event: any): void => {
                if (!document.getElementById("cloneButton").classList.contains("jqx-fill-state-disabled")){
                    this.saveGridinfo();
                    let rowData = this.amhAssignListGrid.getrowdata(this.amhAssignListGrid.selectedrowindex());
                    this.router.navigate(['amh-routing/assignment/clone'],{queryParams: { 'code': rowData.code, 'st': this.defaultOption.id,'return_to':'assignment-list'}})
                }
            });
            // delete selected row.
            deleteButton.addEventHandler('click', (event: any): void => {
                this.assignsToDelete = []
                if(this.amhAssignListGrid.getselectedrowindexes().length != 0){
                    this.amhAssignListGrid.getselectedrowindexes().map(rowindex =>{
                        if (!this.assignsToDelete.includes(this.amhAssignListGrid.getrowdata(rowindex).code))
                            this.assignsToDelete.push(this.amhAssignListGrid.getrowdata(rowindex).code)
                    })
                }
                this.loadingWindow.open();
                this.status = "alert"
                this.loadingWindow.showCloseButton(true);
                this.loadingWindow.height(190);
                document.getElementById("loadingWindowContent").textContent = "All the assignments selected will be deleted. Are you sure you want to continue?";
                document.getElementById("loadingWindowTitle").textContent = "Alert";
            });
        }
        let reloadButtonOptions = {
            width: 80, height: 25, value: '<i class="fas fa-redo fa-lg" style="color: green"></i> Reload',
            textPosition: 'center'
        }
        let reloadButton = jqwidgets.createInstance('#reloadButton', 'jqxButton', reloadButtonOptions);
        let searchButtonOptions = {
            width: 80, height: 25, value: '<i class="fas fa-search fa-lg" style="color: dark"></i> Find',
            textPosition: 'center'
        }
        let searchButton = jqwidgets.createInstance('#searchButton', 'jqxButton', searchButtonOptions);
        let fullExportButtonOptions = {
            width: 120, height: 25, value: '<i class="fas fa-file-csv fa-lg" style="color: green"></i> Full Export',
            textPosition: 'center'
        }
        let fullExportButton = jqwidgets.createInstance('#fullExportButton', 'jqxButton', fullExportButtonOptions);
        document.getElementById("fullExportButton").setAttribute("data-toggle","tooltip");
        document.getElementById("fullExportButton").setAttribute("data-placement","top");
        document.getElementById("fullExportButton").setAttribute("title","Export the entire routing");
        let partialExportButtonOptions = {
            width: 120, height: 25, value: '<i class="fas fa-file-csv fa-lg" style="color: green" ></i> Partial Export',
            textPosition: 'center'
        }
        let partialExportButton = jqwidgets.createInstance('#partialExportButton', 'jqxButton', partialExportButtonOptions);
        document.getElementById("partialExportButton").setAttribute("data-toggle","tooltip");
        document.getElementById("partialExportButton").setAttribute("data-placement","top");
        document.getElementById("partialExportButton").setAttribute("title","Export the current result");
        // reload grid data.
        reloadButton.addEventHandler('click', (event: any): void => {
            this.loadAssignments(this.defaultOption)
        });
        // search for a record.
        searchButton.addEventHandler('click', (event: any): void => {
            this.dropDownSource = this.getdropdownSource();
            this.findWindow.open();
            this.findWindow.move(480, 200);
        });
        // export csv.
        fullExportButton.addEventHandler('click', (event: any) => {
            
            let csvContent: Array<Array<string>> = this.dataSource;
            
            let headers = []
            if(this.defaultOption.id == 2 && this.dcstSelectionGroup){
                headers = ['Selection Group', 'Active', 'Selection Seq', 'Selection Code', 'Backend Channel', 'Stop Flag', 'Rule Seq', 'Rule Code', 'Rule Expressions'];
                csvContent.map(row=>{
                    row[1] = row[1].toString().toLowerCase();
                    if(row[5])
                        row[5] = row[5].toString().toLowerCase();
                    else
                        row[5]="";
                });
            }else if(this.defaultOption.id == 2 && !this.dcstSelectionGroup){
                headers = ['Active', 'Selection Seq', 'Selection Code', 'Backend Channel', 'Stop Flag', 'Rule Seq', 'Rule Code', 'Rule Expressions'];
                csvContent.map(row=>{
                    row[0] = row[0].toString().toLowerCase();
                    if(row[4])
                        row[4] = row[4].toString().toLowerCase();
                    else
                        row[4]="";
                });
            }else if(this.defaultOption.id == 4 && this.fbdcstSelectionGroup){
                headers = ['Selection Group', 'Active', 'Selection Seq', 'Selection Code', 'Backend Channel', 'Rule Seq', 'Rule Code', 'Rule Expressions'];
                csvContent.map(row=>{
                    row[1] = row[1].toString().toLowerCase();
                });
            }else{
                headers = ['Active', 'Selection Seq', 'Selection Code', 'Backend Channel', 'Rule Seq', 'Rule Code', 'Rule Expressions'];    
                csvContent.map(row=>{
                    row[0] = row[0].toString().toLowerCase();
                });
            }
            let options = { 
                fieldSeparator: ';',
                headers: headers
            };
            let file = new Angular5Csv(csvContent,"amh_routing_" + new Date().getTime().toString(),options)
            return file;
        });
        // export csv.
        partialExportButton.addEventHandler('click', (event: any) => {
            let csvContent: Array<Array<string>> =[];

            this.amhAssignListGrid.getrows().map(row=>{
                csvContent.push(this.assignToArrayString(row))
            })
            let headers = []
            if(this.defaultOption.id == 2 && this.dcstSelectionGroup){
                headers = ['Selection Group', 'Active', 'Selection Seq', 'Selection Code', 'Backend Channel', 'Stop Flag', 'Rule Seq', 'Rule Code', 'Rule Expressions'];
                csvContent.map(row=>{
                    if(!(row[5]))
                        row[5]="";
                });
            }else if(this.defaultOption.id == 2 && !this.dcstSelectionGroup){
                headers = ['Active', 'Selection Seq', 'Selection Code', 'Backend Channel', 'Stop Flag', 'Rule Seq', 'Rule Code', 'Rule Expressions'];
                csvContent.map(row=>{
                    if (!(row[4]))
                        row[4]="";
                });
            }else if(this.defaultOption.id == 4 && this.fbdcstSelectionGroup){
                headers = ['Selection Group', 'Active', 'Selection Seq', 'Selection Code', 'Backend Channel', 'Rule Seq', 'Rule Code', 'Rule Expressions'];
            }else{
                headers = ['Active', 'Selection Seq', 'Selection Code', 'Backend Channel', 'Rule Seq', 'Rule Code', 'Rule Expressions'];
            }
            let options = { 
                fieldSeparator: ';',
                headers: headers
            };
            let file = new Angular5Csv(csvContent,"amh_routing_" + new Date().getTime().toString(),options)
            return file;
        });
    }

    gridOnContextMenu(event: MouseEvent): boolean {
        let scrollTop = event.pageY;
        let scrollLeft = event.pageX;
        this.clipboard = event.srcElement.textContent
        if(event.srcElement.classList.contains("selectionGroup")){
            document.getElementById("menuList1").textContent = "Copy Text"//"Copy Selection Group"
            this.gridMenu.open(5 + scrollLeft, 5 + scrollTop);
        }
        else if(event.srcElement.classList.contains("code")){
            document.getElementById("menuList1").textContent = "Copy Text"//"Copy Selection Code"
            this.gridMenu.open(5 + scrollLeft, 5 + scrollTop);
        }
        else if(event.srcElement.classList.contains("backCode")){
            document.getElementById("menuList1").textContent = "Copy Text"//"Copy Backend Channel"
            this.gridMenu.open(5 + scrollLeft, 5 + scrollTop);
        }
        else if(event.srcElement.classList.contains("ruleCode")){
            document.getElementById("menuList1").textContent = "Copy Text"//"Copy Rule Code"
            this.gridMenu.open(5 + scrollLeft, 5 + scrollTop);
        }
        else if(event.srcElement.classList.contains("ruleExpressions")){
            document.getElementById("menuList1").textContent = "Copy Text"//"Copy Rule Expression"
            this.gridMenu.open(5 + scrollLeft, 5 + scrollTop);
        }
            return false;
    }
    
    
    gridOnRowClick(event: any): void | boolean {
        if (event.args.rightclick) {
            return false;
        }
    };
    

    gridMenuOnItemClick(event: any): void {
        this.copyToClipboard(this.clipboard)
    };

    findBtnOnClick(): void {
        this.amhAssignListGrid.clearfilters();
        let searchColumnIndex = this.findWindowDropDownList.selectedIndex();
        let datafield = '';

        if(this.defaultOption.id == 2 && this.dcstSelectionGroup){
            switch (searchColumnIndex) {
                case 0:
                    datafield = 'selectionGroup';
                    break;
                case 1:
                    datafield = 'active';
                    break;
                case 2:
                    datafield = 'backSequence';
                    break;
                case 3:
                    datafield = 'code';
                    break;
                case 4:
                    datafield = 'backCode';
                    break;
                case 5:
                    datafield = 'stopFlag';
                    break;
                case 6:
                    datafield = 'ruleSequence';
                    break;
                case 7:
                    datafield = 'ruleCode';
                    break;
                case 8:
                    datafield = 'ruleExpressions';
                    break;
            }
        }else if(this.defaultOption.id == 2 && !this.dcstSelectionGroup){
            switch (searchColumnIndex) {
                case 0:
                    datafield = 'active';
                    break;
                case 1:
                    datafield = 'backSequence';
                    break;
                case 2:
                    datafield = 'code';
                    break;
                case 3:
                    datafield = 'backCode';
                    break;
                case 4:
                    datafield = 'stopFlag';
                    break;
                case 5:
                    datafield = 'ruleSequence';
                    break;
                case 6:
                    datafield = 'ruleCode';
                    break;
                case 7:
                    datafield = 'ruleExpressions';
                    break;
            }
        }else if(this.defaultOption.id == 4 && this.fbdcstSelectionGroup){
            switch (searchColumnIndex) {
                case 0:
                    datafield = 'selectionGroup';
                    break;
                case 1:
                    datafield = 'active';
                    break;
                case 2:
                    datafield = 'backSequence';
                    break;
                case 3:
                    datafield = 'code';
                    break;
                case 4:
                    datafield = 'backCode';
                    break;
                case 5:
                    datafield = 'ruleSequence';
                    break;
                case 6:
                    datafield = 'ruleCode';
                    break;
                case 7:
                    datafield = 'ruleExpressions';
                    break;
            }
        }else{
            switch (searchColumnIndex) {
                case 0:
                    datafield = 'active';
                    break;
                case 1:
                    datafield = 'backSequence';
                    break;
                case 2:
                    datafield = 'code';
                    break;
                case 3:
                    datafield = 'backCode';
                    break;
                case 4:
                    datafield = 'ruleSequence';
                    break;
                case 5:
                    datafield = 'ruleCode';
                    break;
                case 6:
                    datafield = 'ruleExpressions';
                    break;
            }
        }


        let searchText = this.findWindowInput.val();
        let filtergroup = new jqx.filter();
        let filter_or_operator = 1;
        let filtervalue = searchText;
        let filtercondition = 'CONTAINS_CASE_SENSITIVE';
        let filter = filtergroup.createfilter('stringfilter', filtervalue, filtercondition);
        filtergroup.addfilter(filter_or_operator, filter);
        this.amhAssignListGrid.addfilter(datafield, filtergroup);
        // apply the filters.
        this.amhAssignListGrid.applyfilters();
    }

    clearBtnOnClick(): void {
        this.amhAssignListGrid.clearfilters();
    }

    okLoadingBtn(){
        this.status = "loading"
        this.loadingWindow.showCloseButton(false);
        this.loadingWindow.height(160);
        this.saveGridinfo();
        document.getElementById("loadingWindowContent").textContent = "Loading... Please wait for a while.";
        document.getElementById("loadingWindowTitle").textContent = "Delete in progress..." ;
        let count = 0;
        this.assignsToDelete.map(code=> {
            this.log = new ApplicationLog("AMH","",new Date(),this.auth.getUser().username,"amh.modify.assignment","AMH Assignment")
            this.log.extrInfo = "Delete Assignment - Type: " + this.defaultOption.code + " - Code: " + code + "."
            this.amhAssignmentService.deleteAssignmentByCode(this.defaultOption.id,code).subscribe(
              data=> {
                this.logger.debug("delete " + data +" rules!")
                this.log.succeed();
                count = count+1;
              },
              error=> {
                this.logger.error("Error: " + error)
                this.log.fail();
                this.log.extrInfo += " Error: " + error.message + "." 
              }
            ).add(()=>{
              this.applicationLogService.saveApplicationLog(this.log);
              if(count == this.assignsToDelete.length){
                this.status = "success"
                document.getElementById("loadingWindowContent").textContent ="Delete done successfully.";
                document.getElementById("loadingWindowTitle").textContent = "Delete finished";
                this.loadingWindow.showCloseButton(true);
                setTimeout(()=>{                 
                    this.amhAssignmentService.findAssignments(this.defaultOption.id).subscribe(
                        data=>{
                            this.data = [];
                            let resp = AmhAssignmentService.getFromSource(data);
                            resp.map(assign => {
                                 this.data = this.data.concat(this.fromJsonToAssignList(this.defaultOption.id, assign));
                            });
                            this.dataSource = [];
                            this.selectionGroups = [];
                            this.data.map(assign=>{
                                this.dataSource.push(this.assignToArrayString(assign));
                                if(assign.selectionGroup){
                                    if (!this.selectionGroups.includes(assign.selectionGroup))
                                        this.selectionGroups.push(assign.selectionGroup);
                                }
                            })
                            this.selectionGroups.sort();
                            this.dataFields = this.getDataFields();
                            this.amhAssignListGrid.columns(this.getColumns());
                            this.amhAssignListGrid.source(this.getAdapter());
                            this.amhAssignListGrid.pagesizeoptions([10,50,100])

                            if(this._sharedAMHRoutingOverview.getAssignmentType()!=undefined){
                                if(this._sharedAMHRoutingOverview.getFilterInformation().length>0){
                                    this._sharedAMHRoutingOverview.getFilterInformation().map(filter=>{
                                        this.amhAssignListGrid.addfilter(filter.datafield,filter.filter)
                                        this.amhAssignListGrid.applyfilters()
                                    })
                                }
                                if(this._sharedAMHRoutingOverview.getSortInformation().sortcolumn){
                                    this.amhAssignListGrid.sortby(this._sharedAMHRoutingOverview.getSortInformation().sortcolumn,this._sharedAMHRoutingOverview.getSortInformation().sortdirection.ascending?"ascending":"descending");
                                }
                                this.amhAssignListGrid.pagesize(this._sharedAMHRoutingOverview.getPagingInformation().pagesize)
                                this.amhAssignListGrid.gotopage(this._sharedAMHRoutingOverview.getPagingInformation().pagenum)
                                this.amhAssignListGrid.groups(this._sharedAMHRoutingOverview.getGroupInformation())
                                
                            }
                        },
                        err=>{
                            this.logger.error("Can't get assignments. Error code: %s, URL: %s ", err.status, err.url)
                        }
                    ).add(()=>{
                        this.loadingWindow.close();
                    })
                },1000)
            }
            });
        });
    }

    cancelLoadingBtn(){
        this.loadingWindow.close();
    }

    private selectedAssignmentType(option : Option) : Option {
        let optionSelected;
        if (option != undefined) 
          optionSelected = this.selectionTables.find((type) => { return type.id == option.id; });
        return optionSelected ? optionSelected : this.selectionTables[0]; 
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
              
                assign.backends.map( b => {
                    backends.push(b.code);
                })
                backends = backends.sort()
                
                backends.map( b => {
                    backend += b + "\n"
                })
                backend = backend.slice(0,backend.length-1)
    
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

    private updateSelectionTable(option) {
        //let codeToFind = this.defaultOption ? this.defaultOption.code : option.code; 
        //this.optionRollback = this.selectionTables.find((innerOption) => { return innerOption.code === codeToFind; });
        this.defaultOption = option;
        this._sharedAMHRoutingOverview.setAssignmentType(this.defaultOption);
        this.findWindow.close();
        this.loadAssignments(this.defaultOption);
        this.amhAssignListGrid.clearfilters();
        this.amhAssignListGrid.removesort();
        this.amhAssignListGrid.pagesize(10);
        this.amhAssignListGrid.gotopage(1);
        //this.logger.log("selection table updated ------------  " + option.description);
    }

    private loadAssignments(option: Option) {
        if (option == undefined ) {
            option = this.selectionTables[0];
        }
        this.dataSource = [];
        this.amhAssignListGrid.source(this.getAdapter());
        
        this.amhAssignmentService.findAssignments(this.defaultOption.id).subscribe(
            data=>{
                this.data = [];
                let resp = AmhAssignmentService.getFromSource(data);
                resp.map(assign => {
                     this.data = this.data.concat(this.fromJsonToAssignList(this.defaultOption.id, assign));
                });
                this.dataSource = [];
                this.selectionGroups = [];
                this.data.map(assign=>{
                    this.dataSource.push(this.assignToArrayString(assign));
                    if(assign.selectionGroup){
                       if (!this.selectionGroups.includes(assign.selectionGroup))
                           this.selectionGroups.push(assign.selectionGroup);
                   }
                })
                this.selectionGroups.sort();
                this.dataFields = this.getDataFields();
                this.amhAssignListGrid.columns(this.getColumns());
                this.amhAssignListGrid.source(this.getAdapter());
                this.amhAssignListGrid.pagesize(10);
                this.amhAssignListGrid.pagesizeoptions([10,50,100]);
            },
            err=>{
                this.logger.error("Can't get assignments. Error code: %s, URL: %s ", err.status, err.url)
            }
        )
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
          }
        ).add(()=>{
          this.applicationLogService.saveApplicationLog(this.log);
        });
      }


    private actionCancel() {
    // this.logger.log("canceling assignment ...");
    
        //this._sharedAMHRoutingOverview.clearAll();
        this.saveGridinfo();
        this._sharedAMHRule.clearAll();
        this.router.navigate(['amh-routing']);
    }

    public saveGridinfo(){
        this._sharedAMHRoutingOverview.setAssignmentType(this.defaultOption);
        this._sharedAMHRoutingOverview.setFilterInformation(this.amhAssignListGrid.getfilterinformation());
        this._sharedAMHRoutingOverview.setSortInformation(this.amhAssignListGrid.getsortinformation());
        this._sharedAMHRoutingOverview.setPagingInformation(this.amhAssignListGrid.getpaginginformation());
        this._sharedAMHRoutingOverview.setGroupInformation(this.amhAssignListGrid.groups());
    }

    public assignToArrayString(assign: any): any[]{
        if(this.defaultOption.id == 2 && this.dcstSelectionGroup){
            return  [assign.selectionGroup?assign.selectionGroup:"", assign.active, assign.backSequence, assign.code, assign.backCode, assign.stopFlag?assign.stopFlag:false, assign.ruleSequence, assign.ruleCode, assign.ruleExpressions];
        }else if(this.defaultOption.id == 2 && !this.dcstSelectionGroup){
            return  [assign.active, assign.backSequence, assign.code, assign.backCode, assign.stopFlag?assign.stopFlag:false, assign.ruleSequence, assign.ruleCode, assign.ruleExpressions];
        }else if(this.defaultOption.id == 4 && this.fbdcstSelectionGroup){
            return  [assign.selectionGroup?assign.selectionGroup:"", assign.active, assign.backSequence, assign.code, assign.backCode, assign.ruleSequence, assign.ruleCode, assign.ruleExpressions];
        }else{
            return  [assign.active, assign.backSequence, assign.code, assign.backCode, assign.ruleSequence, assign.ruleCode, assign.ruleExpressions];
        }

    }

    copyToClipboard = str => {
        const el = document.createElement('textarea');  // Create a <textarea> element
        el.value = str;                                 // Set its value to the string that you want copied
        el.setAttribute('readonly', '');                // Make it readonly to be tamper-proof
        el.style.position = 'absolute';                 
        el.style.left = '-9999px';                      // Move outside the screen to make it invisible
        document.body.appendChild(el);                  // Append the <textarea> element to the HTML document
        const selected =            
          document.getSelection().rangeCount > 0        // Check if there is any content selected previously
            ? document.getSelection().getRangeAt(0)     // Store selection if found
            : false;                                    // Mark as false to know no selection existed before
        el.select();                                    // Select the <textarea> content
        document.execCommand('copy');                   // Copy - only works as a result of a user action (e.g. click events)
        document.body.removeChild(el);                  // Remove the <textarea> element
        if (selected) {                                 // If a selection existed before copying
          document.getSelection().removeAllRanges();    // Unselect everything on the HTML document
          document.getSelection().addRange(selected);   // Restore the original selection
        }
      };
}
