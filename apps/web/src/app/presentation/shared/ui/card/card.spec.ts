import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Card } from './card';

@Component({
  imports: [Card],
  template: `
    <se-card [spacing]="spacing">
      <p class="projected-content">Conteudo do card</p>
    </se-card>
  `,
})
class CardHost {
  spacing: 'regular' | 'small' = 'regular';
}

describe('Card', () => {
  let fixture: ComponentFixture<CardHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardHost],
    }).compileComponents();

    fixture = TestBed.createComponent(CardHost);
  });

  it('should create', () => {
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should project content', () => {
    fixture.detectChanges();

    const projectedContent = fixture.nativeElement.querySelector('.projected-content');

    expect(projectedContent?.textContent).toContain('Conteudo do card');
  });

  it('should use regular spacing by default', () => {
    fixture.detectChanges();

    const cardElement = fixture.nativeElement.querySelector('.card');

    expect(cardElement.classList.contains('card--small')).toBe(false);
  });

  it('should apply small spacing class', () => {
    fixture.componentInstance.spacing = 'small';
    fixture.detectChanges();

    const cardElement = fixture.nativeElement.querySelector('.card');

    expect(cardElement.classList.contains('card--small')).toBe(true);
  });
});
