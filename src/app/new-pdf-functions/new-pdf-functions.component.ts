import { Component, OnInit } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF} from 'jspdf';


@Component({
  selector: 'app-new-pdf-functions',
  templateUrl: './new-pdf-functions.component.html',
  styleUrls: ['./new-pdf-functions.component.css']
})
export class NewPdfFunctionsComponent implements OnInit {
  pdfPath: string = '../../assets/Document2.pdf'; 
  pdfDoc: any = null;
  canvas!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;
  pageNumber: number = 1;
  isWriting: boolean = false;
  isHighlighting: boolean = false;
  startX: number = 0;
  startY: number = 0;
  isMouseDown: boolean = false;
  annotations: any[] = [];

  constructor() { }

  ngOnInit(): void {
    this.canvas = document.getElementById('pdfCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.loadPdf();
    // this.loadAnnotationsFromLocalStorage();
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this), false);
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this), false);
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this), false);
    this.canvas.addEventListener('mouseleave', this.onMouseLeave.bind(this), false);
    this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this), false);
    this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this), false);
    this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this), false);
  }
  
  renderPage(num: number): void {
    if (this.pdfDoc) {
      this.pdfDoc.getPage(num).then((page: any) => {
        let viewport = page.getViewport({ scale: 1 });
        this.canvas.height = viewport.height;
        this.canvas.width = viewport.width;

        let renderContext = {
          canvasContext: this.ctx,
          viewport: viewport
        };
        page.render(renderContext);
        // this.drawSavedAnnotations();
      });
    }
  }
  
  loadPdf(): void {
    pdfjsLib.GlobalWorkerOptions.workerSrc="../../assets/pdf.worker.min.js"
    pdfjsLib.getDocument(this.pdfPath).promise.then((pdf: any) => {
      this.pdfDoc = pdf;
      this.renderPage(this.pageNumber);
    }).catch((error: any) => {
      console.error('Error loading PDF:', error);
    });
  }

  toggleWriteMode(): void {
    this.isWriting = !this.isWriting;
    if (this.isWriting) {
      this.isHighlighting = false;
      console.log('Writing mode enabled');
    } else {
      console.log('Writing mode disabled');
    }
  }

  toggleHighlightMode(): void {
    this.isHighlighting = !this.isHighlighting;
    if (this.isHighlighting) {
      this.isWriting = false;
      console.log('Highlighting mode enabled');
    } else {
      console.log('Highlighting mode disabled');
    }
  }

  savePdf(): void {
    if (this.canvas !== null) {
      const imageData = this.canvas.toDataURL('image/jpeg'); // Convert canvas to image data URL
  
      const pdf = new jsPDF(); // Create a new jsPDF instance
      const imgWidth = 210; // Width of A4 page in mm
      const imgHeight = (this.canvas.height * imgWidth) / this.canvas.width; // Maintain aspect ratio
  
      pdf.addImage(imageData, 'JPEG', 0, 0, imgWidth, imgHeight); // Embed image into PDF
  
      pdf.save('modified_document.pdf'); // Trigger download of PDF
      console.log('PDF saved successfully');
    } else {
      console.error('Canvas not initialized');
    }
  }
  

  onMouseDown(event: MouseEvent): void {
    if (event.button === 0 && this.isWriting) { // Left mouse button is pressed and writing mode is enabled
      this.isMouseDown = true;
      this.startX = event.clientX - this.canvas.getBoundingClientRect().left;
      this.startY = event.clientY - this.canvas.getBoundingClientRect().top;
      this.ctx.beginPath();
      this.ctx.strokeStyle = 'black';
      this.ctx.lineWidth = 1; // Adjust the width of the line
      this.ctx.moveTo(this.startX, this.startY);
    } else if (this.isHighlighting) { 
      this.isMouseDown = true;
      this.startX = event.clientX - this.canvas.getBoundingClientRect().left;
      this.startY = event.clientY - this.canvas.getBoundingClientRect().top;
      this.drawHighlight(event);
    }
  }

  onMouseMove(event: MouseEvent): void {
    if (this.isMouseDown && this.isWriting) {
      let x = event.clientX - this.canvas.getBoundingClientRect().left;
      let y = event.clientY - this.canvas.getBoundingClientRect().top;
      if (this.ctx) {
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
      }
    } else if (this.isMouseDown && this.isHighlighting) {
      this.drawHighlight(event);
    }
  }

  onMouseUp(): void {
    if (this.isMouseDown && this.isWriting) {
      this.isMouseDown = false;
      this.ctx.closePath();
      this.saveAnnotation('writing', this.startX, this.startY, this.ctx);
    } else if (this.isMouseDown && this.isHighlighting) {
      this.isMouseDown = false;
      this.saveAnnotation('highlight', this.startX, this.startY);
    }
  }

  onMouseLeave(): void {
    if (this.isMouseDown && this.isWriting) {
      this.isMouseDown = false;
      this.ctx.closePath();
      this.saveAnnotation('writing', this.startX, this.startY, this.ctx);
    } else if (this.isMouseDown && this.isHighlighting) {
      this.isMouseDown = false;
      this.saveAnnotation('highlight', this.startX, this.startY);
    }
  }

  onScroll(event: WheelEvent): void {
    if (event.deltaY < 0) {
      this.pageNumber--;
    } else {
      this.pageNumber++;
    }

    if (this.pageNumber < 1) {
      this.pageNumber = 1;
    }

    if (this.pageNumber > this.pdfDoc.numPages) {
      this.pageNumber = this.pdfDoc.numPages;
    }

    this.renderPage(this.pageNumber);
  }

  drawHighlight(event: MouseEvent | TouchEvent): void {
    let x = 0;
    let y = 0;
    if (event instanceof MouseEvent) {
      x = (event as MouseEvent).clientX - this.canvas.getBoundingClientRect().left;
      y = (event as MouseEvent).clientY - this.canvas.getBoundingClientRect().top;
    } else if (event instanceof TouchEvent) {
      const touch = (event as TouchEvent).touches[0];
      const rect = this.canvas.getBoundingClientRect();
      x = touch.clientX - rect.left;
      y = touch.clientY - rect.top;
    } 
    if (x !== undefined && y !== undefined) {
      const highlightSize = 18; // Adjust as needed

      // Calculate the distance between previous and current positions
      const dx = x - this.startX;
      const dy = y - this.startY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Number of segments to interpolate
      const numSegments = Math.ceil(distance / (highlightSize / 2));

      // Interpolate and draw lines between consecutive points
      for (let i = 0; i < numSegments; i++) {
        const interpX = this.startX + dx * (i / numSegments);
        const interpY = this.startY + dy * (i / numSegments);
        const nextX = this.startX + dx * ((i + 1) / numSegments);
        const nextY = this.startY + dy * ((i + 1) / numSegments);

        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.07)'; // Adjust transparency as needed
        this.ctx.lineWidth = highlightSize;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(interpX, interpY);
        this.ctx.lineTo(nextX, nextY);
        this.ctx.stroke();
        this.ctx.closePath();
        this.ctx.restore();

        // Save annotation points (only save the endpoint)
        if (i === numSegments - 1) {
          this.saveAnnotation('highlight', nextX, nextY);
        }
      }

      // Update start point for next segment
      this.startX = x;
      this.startY = y;
    }
}


  

  saveAnnotation(type: string, x: number, y: number, ctx?: CanvasRenderingContext2D): void {
    this.annotations.push({ type, x, y, ctx });
    this.saveAnnotations();
  }

  saveAnnotations(): void {
    localStorage.setItem('pdfAnnotations', JSON.stringify(this.annotations));
  }

  loadAnnotationsFromLocalStorage(): void {
    const savedAnnotations = localStorage.getItem('pdfAnnotations');
    if (savedAnnotations) {
      this.annotations = JSON.parse(savedAnnotations);
    }
  }

  drawSavedAnnotations(): void {
    for (const annotation of this.annotations) {
      if (annotation.type === 'writing') {
        annotation.ctx.fillText('Your text here', annotation.x, annotation.y);
      } else if (annotation.type === 'highlight') {
        const highlightSize = 20; 
        const halfSize = highlightSize / 2;
        this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        this.ctx.fillRect(annotation.x - halfSize, annotation.y - halfSize, highlightSize, highlightSize);
      }
    }
  }
  onTouchStart(event: TouchEvent): void {
    event.preventDefault();
    const touch = event.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
  
    if (this.isWriting) {
      this.startX = x;
      this.startY = y;
      this.ctx.beginPath();
      this.ctx.strokeStyle = 'black';
      this.ctx.lineWidth = 2;
      this.ctx.moveTo(this.startX, this.startY);
    } else if (this.isHighlighting) {
      this.startX = x;
      this.startY = y;
      this.drawHighlight(event);
    }
  }
  
  onTouchMove(event: TouchEvent): void {
    event.preventDefault();
    const touch = event.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
  
    if (this.isWriting) {
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
    } else if (this.isHighlighting) {
      this.drawHighlight(event);
    }
  }
  
  onTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    if (this.isWriting) {
      this.ctx.closePath();
      this.saveAnnotation('writing', this.startX, this.startY);
    } else if (this.isHighlighting) {
      this.saveAnnotation('highlight', this.startX, this.startY);
    }
  }
  
  
}