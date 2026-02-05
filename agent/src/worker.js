/**
 * Worker: Task execution and completion logic
 */

class TaskWorker {
  constructor() {
    this.completedTasks = 0
    this.totalEarnings = 0
    this.taskHistory = []
  }

  /**
   * Simulate task completion
   */
  async completeTask(task) {
    // Simulate work (random 2-5 seconds)
    const workTime = 2000 + Math.random() * 3000
    await new Promise(resolve => setTimeout(resolve, workTime))

    // Generate rating (70-100, weighted toward higher)
    const rating = Math.floor(70 + Math.random() * 30)
    
    this.completedTasks++
    this.totalEarnings += parseFloat(task.payoutAmount)
    
    this.taskHistory.push({
      taskId: task.id,
      description: task.description,
      payout: task.payoutAmount,
      rating,
      completedAt: new Date().toISOString()
    })

    return {
      taskId: task.id,
      rating,
      earnings: task.payoutAmount,
      totalEarnings: this.totalEarnings.toFixed(2),
      completedCount: this.completedTasks
    }
  }

  getStats() {
    return {
      completedTasks: this.completedTasks,
      totalEarnings: this.totalEarnings.toFixed(2),
      averageRating: this.taskHistory.length > 0
        ? (this.taskHistory.reduce((sum, t) => sum + t.rating, 0) / this.taskHistory.length).toFixed(1)
        : 0,
      taskHistory: this.taskHistory
    }
  }
}

module.exports = TaskWorker
