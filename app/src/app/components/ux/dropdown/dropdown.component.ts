import { Component, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
    selector: 'app-dropdown',
    templateUrl: './dropdown.component.html',
    styleUrls: ['./dropdown.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: DropdownComponent,
        },
    ],
    standalone: false
})
export class DropdownComponent implements ControlValueAccessor {
  @Input() options: any[] = [];

  private _innerValue: any[] = [];
  private onChangeCallback: (_: any[]) => void = () => {};
  private onTouchedCallback: () => void = () => {};

  public get innerValue(): any[] {
    return this._innerValue;
  }

  public set innerValue(newValue: any[]) {
    this._innerValue = newValue;
    this.onChangeCallback(newValue);
  }

  constructor() {}

  writeValue(obj: any) {
    if (obj !== this.innerValue) {
      this.innerValue = obj;
    }
  }

  registerOnChange(fn: any) {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: any) {
    this.onTouchedCallback = fn;
  }

  setDisabledState(isDisabled: boolean) {}
}
