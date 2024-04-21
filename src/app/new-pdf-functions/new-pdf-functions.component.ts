import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF} from 'jspdf';

@Component({
  selector: 'app-new-pdf-functions',
  templateUrl: './new-pdf-functions.component.html',
  styleUrls: ['./new-pdf-functions.component.css']
})
export class NewPdfFunctionsComponent implements OnInit{
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
  focusedPageNumber: number | null = null;
  bkpage:number | null = null;

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
        const cv = document.createElement("canvas");
        cv.height = viewport.height;
        cv.width = viewport.width;
        cv.classList.add('pdf-canvas');
        cv.style.border = "1px solid black";
        cv.style.marginBottom='2%'
        cv.setAttribute('id', 'pdfCanvas'); 
        cv.setAttribute('data-page-number', num.toString());
        cv.addEventListener('mousedown', () => this.setFocusedPageNumber(num));
        cv.addEventListener('mousemove', this.onMouseMove.bind(this), false);
        cv.addEventListener('mouseup', this.onMouseUp.bind(this), false);
        cv.addEventListener('mouseleave', this.onMouseLeave.bind(this), false);
        cv.addEventListener('touchstart', this.onTouchStart.bind(this), false);
        cv.addEventListener('touchmove', this.onTouchMove.bind(this), false);
        cv.addEventListener('touchend', this.onTouchEnd.bind(this), false);
        const dv = document.getElementById("pdfContainer");
        dv?.appendChild(cv);
        const ctx = cv.getContext("2d");
  
        let renderContext = {
          canvasContext: ctx,
          viewport: viewport
        };
  
        // Render the page onto the new canvas
        page.render(renderContext);
      }).catch((error: any) => {
        console.error('Error rendering page:', error);
      });
    }
  }
  setbkPagenumber(){
    let bookmarkPage=sessionStorage.getItem("Bookmark");
    console.log("this is supposed to be bookmark page",bookmarkPage);
    const canvas = document.querySelector(`.pdf-canvas[data-page-number="${bookmarkPage}"]`) as HTMLElement | null;
    if (canvas) {
      canvas.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
  }  
  setFocusedPageNumber(pageNumber: number): void {
    sessionStorage.setItem("Bookmark",pageNumber.toString());
    this.focusedPageNumber = pageNumber;
    console.log("focused pagenumber" , this.focusedPageNumber)
  }
  loadPdf(): void {
    pdfjsLib.GlobalWorkerOptions.workerSrc="../../assets/pdf.worker.min.js"
    pdfjsLib.getDocument(this.pdfPath).promise.then((pdf: any) => {
      this.pdfDoc = pdf;
      for (let i = 1; i <= pdf.numPages; i++) {
        this.renderPage(i);
      }
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
    const canvases = document.querySelectorAll<HTMLCanvasElement>('.pdf-canvas'); // Get all canvas elements
    if (canvases.length === 0) {
      console.error('No canvases found');
     
    }
    const pdf = new jsPDF();
    canvases.forEach((canvas, index) => {
      const imageData = canvas.toDataURL('image/jpeg'); // Convert canvas to image data URL
      const imgWidth = pdf.internal.pageSize.getWidth(); // Width of PDF page
      const imgHeight = (canvas.height * imgWidth) / canvas.width; // Maintain aspect ratio
      if (index !== 0) {
        pdf.addPage();
      }
      pdf.addImage(imageData, 'JPEG', 0, 0, imgWidth, imgHeight); // Embed image into PDF
    });
    pdf.save('modified_document.pdf'); // Trigger download of PDF
    console.log('PDF saved successfully');
  }
  

  onMouseDown(event: MouseEvent): void {
    if (event.button === 0 && this.isWriting) { // Left mouse button is pressed and writing mode is enabled
      this.isMouseDown = true;
      const canvas = event.target as HTMLCanvasElement;
      const ctx = canvas.getContext('2d')!;
      this.startX = event.clientX - canvas.getBoundingClientRect().left;
      this.startY = event.clientY - canvas.getBoundingClientRect().top;
      ctx.beginPath();
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 1; // Adjust the width of the line
      ctx.moveTo(this.startX, this.startY);
    } else if (this.isHighlighting) { 
      this.isMouseDown = true;
      const canvas = event.target as HTMLCanvasElement;
      const ctx = canvas.getContext('2d')!;
      this.startX = event.clientX - canvas.getBoundingClientRect().left;
      this.startY = event.clientY - canvas.getBoundingClientRect().top;
      this.drawHighlight(event, ctx);
    }
  }
  
  onMouseMove(event: MouseEvent): void {
    if (this.isMouseDown && this.isWriting) {
      let x = event.clientX - (event.target as HTMLCanvasElement).getBoundingClientRect().left;
      let y = event.clientY - (event.target as HTMLCanvasElement).getBoundingClientRect().top;
      const ctx = (event.target as HTMLCanvasElement).getContext('2d')!;
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (this.isMouseDown && this.isHighlighting) {
      const ctx = (event.target as HTMLCanvasElement).getContext('2d')!;
      this.drawHighlight(event, ctx);
    }
  }
  
  onMouseUp(): void {
    if (this.isMouseDown && this.isWriting) {
      this.isMouseDown = false;
      const ctx = (document.activeElement as HTMLCanvasElement).getContext('2d')!;
      ctx.closePath();
      this.saveAnnotation('writing', this.startX, this.startY, ctx);
    } else if (this.isMouseDown && this.isHighlighting) {
      this.isMouseDown = false;
      const ctx = (document.activeElement as HTMLCanvasElement).getContext('2d')!;
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
  onMouseLeave(): void {
    if (this.isMouseDown && this.isWriting) {
      this.isMouseDown = false;
      const ctx = (document.activeElement as HTMLCanvasElement).getContext('2d')!;
      ctx.closePath();
      this.saveAnnotation('writing', this.startX, this.startY, ctx);
    } else if (this.isMouseDown && this.isHighlighting) {
      this.isMouseDown = false;
      const ctx = (document.activeElement as HTMLCanvasElement).getContext('2d')!;
      this.saveAnnotation('highlight', this.startX, this.startY);
    }
  }
  
  drawHighlight(event: MouseEvent | TouchEvent, ctx: CanvasRenderingContext2D): void {
    let x = 0;
    let y = 0;
    if (event instanceof MouseEvent) {
      x = (event as MouseEvent).clientX - (event.target as HTMLCanvasElement).getBoundingClientRect().left;
      y = (event as MouseEvent).clientY - (event.target as HTMLCanvasElement).getBoundingClientRect().top;
    } else if (event instanceof TouchEvent) {
      const touch = (event as TouchEvent).touches[0];
      const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
      x = touch.clientX - rect.left;
      y = touch.clientY - rect.top;
    } 
    if (x!== undefined && y!== undefined) {
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
  
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.07)'; // Adjust transparency as needed
        ctx.lineWidth = highlightSize;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(interpX,interpY);
        ctx.lineTo(nextX, nextY);
        ctx.stroke();
        ctx.closePath();
        ctx.restore();
  
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
    const canvas = event.target as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
  
    if (this.isWriting) {
      this.startX = x;
      this.startY = y;
      ctx.beginPath();
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.moveTo(this.startX, this.startY);
    } else if (this.isHighlighting) {
      this.startX = x;
      this.startY = y;
      this.drawHighlight(event, ctx);
    }
  }
  
  onTouchMove(event: TouchEvent): void {
    event.preventDefault();
    const touch = event.touches[0];
    const canvas = event.target as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
  
    if (this.isWriting) {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (this.isHighlighting) {
      this.drawHighlight(event, ctx);
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