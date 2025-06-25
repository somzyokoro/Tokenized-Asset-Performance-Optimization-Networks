;; Optimization Planning Contract
;; Plans and manages performance optimization strategies

(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u300))
(define-constant ERR_PLAN_NOT_FOUND (err u301))
(define-constant ERR_INVALID_PLAN (err u302))
(define-constant ERR_PLAN_EXISTS (err u303))

;; Data structures
(define-map optimization-plans
  { plan-id: uint }
  {
    asset-id: uint,
    analyst-id: uint,
    strategy-type: (string-ascii 20),
    target-roi: int,
    target-risk: uint,
    implementation-timeline: uint,
    status: (string-ascii 20),
    created-at: uint
  }
)

(define-map plan-actions
  { plan-id: uint, action-id: uint }
  {
    action-type: (string-ascii 30),
    description: (string-ascii 100),
    priority: uint,
    estimated-impact: uint,
    completed: bool
  }
)

(define-data-var next-plan-id uint u1)
(define-data-var next-action-id uint u1)

;; Public functions
(define-public (create-optimization-plan
  (asset-id uint)
  (analyst-id uint)
  (strategy-type (string-ascii 20))
  (target-roi int)
  (target-risk uint)
  (timeline uint))
  (let ((plan-id (var-get next-plan-id)))

    (asserts! (<= target-risk u100) ERR_INVALID_PLAN)
    (asserts! (> timeline u0) ERR_INVALID_PLAN)

    (map-set optimization-plans
      { plan-id: plan-id }
      {
        asset-id: asset-id,
        analyst-id: analyst-id,
        strategy-type: strategy-type,
        target-roi: target-roi,
        target-risk: target-risk,
        implementation-timeline: timeline,
        status: "pending",
        created-at: block-height
      }
    )

    (var-set next-plan-id (+ plan-id u1))
    (ok plan-id)
  )
)

(define-public (add-plan-action
  (plan-id uint)
  (action-type (string-ascii 30))
  (description (string-ascii 100))
  (priority uint)
  (estimated-impact uint))
  (let ((action-id (var-get next-action-id)))

    (asserts! (is-some (map-get? optimization-plans { plan-id: plan-id })) ERR_PLAN_NOT_FOUND)
    (asserts! (and (>= priority u1) (<= priority u5)) ERR_INVALID_PLAN)
    (asserts! (<= estimated-impact u100) ERR_INVALID_PLAN)

    (map-set plan-actions
      { plan-id: plan-id, action-id: action-id }
      {
        action-type: action-type,
        description: description,
        priority: priority,
        estimated-impact: estimated-impact,
        completed: false
      }
    )

    (var-set next-action-id (+ action-id u1))
    (ok action-id)
  )
)

(define-public (update-plan-status (plan-id uint) (new-status (string-ascii 20)))
  (match (map-get? optimization-plans { plan-id: plan-id })
    plan-data
    (begin
      (map-set optimization-plans
        { plan-id: plan-id }
        (merge plan-data { status: new-status })
      )
      (ok true)
    )
    ERR_PLAN_NOT_FOUND
  )
)

;; Read-only functions
(define-read-only (get-optimization-plan (plan-id uint))
  (map-get? optimization-plans { plan-id: plan-id })
)

(define-read-only (get-plan-action (plan-id uint) (action-id uint))
  (map-get? plan-actions { plan-id: plan-id, action-id: action-id })
)
