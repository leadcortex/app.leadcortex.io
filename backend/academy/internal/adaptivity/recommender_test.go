// backend/academy/internal/adaptivity/recommender_test.go

package adaptivity

import (
	"testing"
	"time"

	"github.com/leadcortex/academy/internal/domain"
)


func TestRecommend_NilLearner(t *testing.T) {
	rec := Recommend(nil, RecommendOptions{Now: fixedTime()})
	if rec.Kind != RecoNone {
		t.Errorf("attendu RecoNone, obtenu %s", rec.Kind)
	}
}


func TestRecommend_ResumeLesson(t *testing.T) {
	l := newLearner()
	l.LessonProgress["l1"] = domain.LessonProgress{
		LessonID: "l1",
		Status:   domain.LessonStatusInProgress,
	}

	rec := Recommend(l, RecommendOptions{Now: fixedTime()})
	if rec.Kind != RecoResumeLesson {
		t.Fatalf("attendu RecoResumeLesson, obtenu %s", rec.Kind)
	}
	if rec.LessonID != "l1" {
		t.Errorf("LessonID : attendu l1, obtenu %s", rec.LessonID)
	}
	if rec.Priority != 0 {
		t.Errorf("Priority : attendu 0, obtenu %d", rec.Priority)
	}
}


func TestRecommend_ReviewConcept_PreferReview(t *testing.T) {
	l := newLearner()
	l.ConceptMastery["c1"] = domain.Mastery{
		ConceptID: "c1",
		Level:     domain.MasteryFragile,
		Attempts:  3,
		Correct:   1,
	}

	rec := Recommend(l, RecommendOptions{
		Now:          fixedTime(),
		PreferReview: true,
	})
	if rec.Kind != RecoReviewConcept {
		t.Errorf("attendu RecoReviewConcept, obtenu %s", rec.Kind)
	}
	if rec.ConceptID != "c1" {
		t.Errorf("ConceptID : attendu c1, obtenu %s", rec.ConceptID)
	}
}

func TestRecommend_ReviewConcept_OverdueSrs(t *testing.T) {
	l := newLearner()
	l.ConceptMastery["c1"] = domain.Mastery{
		ConceptID: "c1", Level: domain.MasteryFragile, Attempts: 3,
	}
	card := *domain.NewSrsCard("card-1", "c1", "Q", "A")
	card.DueAt = fixedTime().Add(-time.Hour)

	rec := Recommend(l, RecommendOptions{
		Now:      fixedTime(),
		SrsCards: []domain.SrsCard{card},
	})
	if rec.Kind != RecoReviewConcept {
		t.Errorf("attendu RecoReviewConcept, obtenu %s", rec.Kind)
	}
}


func TestRecommend_StartLesson(t *testing.T) {
	reg := buildTestRegistry(t)
	l := newLearner()

	rec := Recommend(l, RecommendOptions{
		Now:      fixedTime(),
		Registry: reg,
	})
	if rec.Kind != RecoStartLesson {
		t.Fatalf("attendu RecoStartLesson, obtenu %s", rec.Kind)
	}
	if rec.LessonID != "l1" {
		t.Errorf("LessonID : attendu l1 (première débloquée), obtenu %s", rec.LessonID)
	}
}


func TestRecommend_NothingToDo(t *testing.T) {
	l := newLearner()
	rec := Recommend(l, RecommendOptions{Now: fixedTime()})
	if rec.Kind != RecoNone {
		t.Errorf("attendu RecoNone, obtenu %s", rec.Kind)
	}
}


func TestRecommend_ResumeBeatsReview(t *testing.T) {
	reg := buildTestRegistry(t)
	l := newLearner()
	l.LessonProgress["l1"] = domain.LessonProgress{
		LessonID: "l1",
		Status:   domain.LessonStatusInProgress,
	}
	l.ConceptMastery["c1"] = domain.Mastery{
		ConceptID: "c1", Level: domain.MasteryFragile, Attempts: 3,
	}

	rec := Recommend(l, RecommendOptions{
		Now:          fixedTime(),
		Registry:     reg,
		PreferReview: true,
	})
	if rec.Kind == RecoNone {
		t.Errorf("attendu une recommandation, obtenu RecoNone")
	}
}