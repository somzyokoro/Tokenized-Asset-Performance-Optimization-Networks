import { describe, it, expect, beforeEach } from 'vitest'

describe('Optimization Planning Contract', () => {
  let contractState = {
    optimizationPlans: new Map(),
    planActions: new Map(),
    nextPlanId: 1,
    nextActionId: 1
  }
  
  beforeEach(() => {
    contractState = {
      optimizationPlans: new Map(),
      planActions: new Map(),
      nextPlanId: 1,
      nextActionId: 1
    }
  })
  
  const createOptimizationPlan = (assetId, analystId, strategyType, targetRoi, targetRisk, timeline) => {
    if (targetRisk > 100) {
      return { error: 302 } // ERR_INVALID_PLAN
    }
    
    if (timeline <= 0) {
      return { error: 302 } // ERR_INVALID_PLAN
    }
    
    const planId = contractState.nextPlanId
    const planData = {
      assetId,
      analystId,
      strategyType,
      targetRoi,
      targetRisk,
      implementationTimeline: timeline,
      status: 'pending',
      createdAt: 1000 // Mock block height
    }
    
    contractState.optimizationPlans.set(planId, planData)
    contractState.nextPlanId += 1
    
    return { success: planId }
  }
  
  const addPlanAction = (planId, actionType, description, priority, estimatedImpact) => {
    if (!contractState.optimizationPlans.has(planId)) {
      return { error: 301 } // ERR_PLAN_NOT_FOUND
    }
    
    if (priority < 1 || priority > 5) {
      return { error: 302 } // ERR_INVALID_PLAN
    }
    
    if (estimatedImpact > 100) {
      return { error: 302 } // ERR_INVALID_PLAN
    }
    
    const actionId = contractState.nextActionId
    const actionData = {
      actionType,
      description,
      priority,
      estimatedImpact,
      completed: false
    }
    
    const key = `${planId}-${actionId}`
    contractState.planActions.set(key, actionData)
    contractState.nextActionId += 1
    
    return { success: actionId }
  }
  
  const updatePlanStatus = (planId, newStatus) => {
    const plan = contractState.optimizationPlans.get(planId)
    if (!plan) {
      return { error: 301 } // ERR_PLAN_NOT_FOUND
    }
    
    plan.status = newStatus
    contractState.optimizationPlans.set(planId, plan)
    return { success: true }
  }
  
  const getOptimizationPlan = (planId) => {
    return contractState.optimizationPlans.get(planId) || null
  }
  
  const getPlanAction = (planId, actionId) => {
    const key = `${planId}-${actionId}`
    return contractState.planActions.get(key) || null
  }
  
  describe('Plan Creation', () => {
    it('should create optimization plan successfully', () => {
      const result = createOptimizationPlan(1, 1, 'diversification', 20, 25, 100)
      
      expect(result.success).toBe(1)
      expect(contractState.nextPlanId).toBe(2)
      
      const plan = getOptimizationPlan(1)
      expect(plan.strategyType).toBe('diversification')
      expect(plan.targetRoi).toBe(20)
      expect(plan.targetRisk).toBe(25)
      expect(plan.status).toBe('pending')
    })
    
    it('should reject invalid target risk', () => {
      const result = createOptimizationPlan(1, 1, 'diversification', 20, 150, 100)
      expect(result.error).toBe(302) // ERR_INVALID_PLAN
    })
    
    it('should reject invalid timeline', () => {
      const result1 = createOptimizationPlan(1, 1, 'diversification', 20, 25, 0)
      const result2 = createOptimizationPlan(1, 1, 'diversification', 20, 25, -10)
      
      expect(result1.error).toBe(302) // ERR_INVALID_PLAN
      expect(result2.error).toBe(302) // ERR_INVALID_PLAN
    })
  })
  
  describe('Action Management', () => {
    beforeEach(() => {
      createOptimizationPlan(1, 1, 'diversification', 20, 25, 100)
    })
    
    it('should add plan action successfully', () => {
      const result = addPlanAction(1, 'rebalance', 'Rebalance portfolio allocation', 3, 75)
      
      expect(result.success).toBe(1)
      expect(contractState.nextActionId).toBe(2)
      
      const action = getPlanAction(1, 1)
      expect(action.actionType).toBe('rebalance')
      expect(action.description).toBe('Rebalance portfolio allocation')
      expect(action.priority).toBe(3)
      expect(action.estimatedImpact).toBe(75)
      expect(action.completed).toBe(false)
    })
    
    it('should reject action for non-existent plan', () => {
      const result = addPlanAction(999, 'rebalance', 'Test action', 3, 75)
      expect(result.error).toBe(301) // ERR_PLAN_NOT_FOUND
    })
    
    it('should reject invalid priority', () => {
      const result1 = addPlanAction(1, 'rebalance', 'Test action', 0, 75)
      const result2 = addPlanAction(1, 'rebalance', 'Test action', 6, 75)
      
      expect(result1.error).toBe(302) // ERR_INVALID_PLAN
      expect(result2.error).toBe(302) // ERR_INVALID_PLAN
    })
    
    it('should reject invalid estimated impact', () => {
      const result = addPlanAction(1, 'rebalance', 'Test action', 3, 150)
      expect(result.error).toBe(302) // ERR_INVALID_PLAN
    })
  })
  
  describe('Plan Status Management', () => {
    beforeEach(() => {
      createOptimizationPlan(1, 1, 'diversification', 20, 25, 100)
    })
    
    it('should update plan status successfully', () => {
      const result = updatePlanStatus(1, 'in-progress')
      
      expect(result.success).toBe(true)
      
      const plan = getOptimizationPlan(1)
      expect(plan.status).toBe('in-progress')
    })
    
    it('should reject status update for non-existent plan', () => {
      const result = updatePlanStatus(999, 'in-progress')
      expect(result.error).toBe(301) // ERR_PLAN_NOT_FOUND
    })
  })
  
  describe('Plan Queries', () => {
    beforeEach(() => {
      createOptimizationPlan(1, 1, 'diversification', 20, 25, 100)
      createOptimizationPlan(2, 2, 'rebalancing', 15, 30, 80)
      addPlanAction(1, 'rebalance', 'Rebalance allocation', 3, 75)
      addPlanAction(1, 'hedge', 'Add hedging instruments', 2, 60)
    })
    
    it('should get optimization plan by ID', () => {
      const plan = getOptimizationPlan(1)
      
      expect(plan).toBeTruthy()
      expect(plan.strategyType).toBe('diversification')
      expect(plan.targetRoi).toBe(20)
      expect(plan.implementationTimeline).toBe(100)
    })
    
    it('should get plan action by IDs', () => {
      const action = getPlanAction(1, 1)
      
      expect(action).toBeTruthy()
      expect(action.actionType).toBe('rebalance')
      expect(action.priority).toBe(3)
      expect(action.estimatedImpact).toBe(75)
    })
    
    it('should return null for non-existent plan', () => {
      const plan = getOptimizationPlan(999)
      expect(plan).toBeNull()
    })
    
    it('should return null for non-existent action', () => {
      const action = getPlanAction(1, 999)
      expect(action).toBeNull()
    })
  })
  
  describe('Complex Scenarios', () => {
    it('should handle multiple plans and actions', () => {
      // Create multiple plans
      createOptimizationPlan(1, 1, 'diversification', 20, 25, 100)
      createOptimizationPlan(2, 2, 'rebalancing', 15, 30, 80)
      createOptimizationPlan(3, 1, 'hedging', 10, 20, 120)
      
      // Add actions to different plans
      addPlanAction(1, 'rebalance', 'Action 1', 3, 75)
      addPlanAction(2, 'hedge', 'Action 2', 2, 60)
      addPlanAction(1, 'diversify', 'Action 3', 4, 80)
      
      // Verify all data is stored correctly
      expect(getOptimizationPlan(1).strategyType).toBe('diversification')
      expect(getOptimizationPlan(2).strategyType).toBe('rebalancing')
      expect(getOptimizationPlan(3).strategyType).toBe('hedging')
      
      expect(getPlanAction(1, 1).actionType).toBe('rebalance')
      expect(getPlanAction(2, 2).actionType).toBe('hedge')
      expect(getPlanAction(1, 3).actionType).toBe('diversify')
    })
  })
})
