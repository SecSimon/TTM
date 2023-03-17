import { Component, Input, OnInit, Optional } from '@angular/core';
import { MyString } from '../../../util/dialog.service';

@Component({
  selector: 'app-image-view',
  templateUrl: './image-view.component.html',
  styleUrls: ['./image-view.component.scss']
})
export class ImageViewComponent implements OnInit {

  @Input() public image: string;

  constructor(@Optional() img: MyString) {
    if (img) this.image = img.Value;
  }

  ngOnInit(): void {
  }

}
