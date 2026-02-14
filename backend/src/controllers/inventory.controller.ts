import { Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../middleware/auth.middleware'

const prisma = new PrismaClient()

// Get all inventory items for workspace
export const getAllInventoryItems = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { isActive, lowStock } = req.query

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    const where: any = {
      workspaceId: user.workspace.id
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      include: {
        _count: {
          select: {
            usage: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Filter for low stock if requested
    let filteredItems = items
    if (lowStock === 'true') {
      filteredItems = items.filter(item => item.quantity <= item.lowStockThreshold)
    }

    res.json({
      success: true,
      data: filteredItems
    })
  } catch (error) {
    console.error('Get inventory items error:', error)
    res.status(500).json({ error: 'Failed to fetch inventory items' })
  }
}

// Get single inventory item by ID
export const getInventoryItemById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    const item = await prisma.inventoryItem.findFirst({
      where: {
        id,
        workspaceId: user.workspace.id
      },
      include: {
        usage: {
          include: {
            bookingType: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { usedAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            usage: true
          }
        }
      }
    })

    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' })
    }

    res.json({
      success: true,
      data: item
    })
  } catch (error) {
    console.error('Get inventory item error:', error)
    res.status(500).json({ error: 'Failed to fetch inventory item' })
  }
}

// Create new inventory item
export const createInventoryItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { name, description, quantity, lowStockThreshold, unit, isActive } = req.body

    if (!name || quantity === undefined) {
      return res.status(400).json({ 
        error: 'Name and quantity are required' 
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    const item = await prisma.inventoryItem.create({
      data: {
        workspaceId: user.workspace.id,
        name,
        description,
        quantity: parseInt(quantity),
        lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold) : 10,
        unit,
        isActive: isActive !== undefined ? isActive : true
      },
      include: {
        _count: {
          select: {
            usage: true
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      data: item
    })
  } catch (error) {
    console.error('Create inventory item error:', error)
    res.status(500).json({ error: 'Failed to create inventory item' })
  }
}

// Update inventory item
export const updateInventoryItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { id } = req.params
    const { name, description, quantity, lowStockThreshold, unit, isActive } = req.body

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    // Check if item exists and belongs to workspace
    const existingItem = await prisma.inventoryItem.findFirst({
      where: {
        id,
        workspaceId: user.workspace.id
      }
    })

    if (!existingItem) {
      return res.status(404).json({ error: 'Inventory item not found' })
    }

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: {
        name,
        description,
        quantity: quantity !== undefined ? parseInt(quantity) : undefined,
        lowStockThreshold: lowStockThreshold !== undefined ? parseInt(lowStockThreshold) : undefined,
        unit,
        isActive
      },
      include: {
        _count: {
          select: {
            usage: true
          }
        }
      }
    })

    res.json({
      success: true,
      data: item
    })
  } catch (error) {
    console.error('Update inventory item error:', error)
    res.status(500).json({ error: 'Failed to update inventory item' })
  }
}

// Delete inventory item
export const deleteInventoryItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    // Check if item exists and belongs to workspace
    const existingItem = await prisma.inventoryItem.findFirst({
      where: {
        id,
        workspaceId: user.workspace.id
      }
    })

    if (!existingItem) {
      return res.status(404).json({ error: 'Inventory item not found' })
    }

    await prisma.inventoryItem.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'Inventory item deleted successfully'
    })
  } catch (error) {
    console.error('Delete inventory item error:', error)
    res.status(500).json({ error: 'Failed to delete inventory item' })
  }
}

// Adjust inventory quantity
export const adjustInventoryQuantity = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { id } = req.params
    const { adjustment, reason } = req.body

    if (adjustment === undefined || adjustment === 0) {
      return res.status(400).json({ error: 'Adjustment amount is required' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    // Check if item exists and belongs to workspace
    const existingItem = await prisma.inventoryItem.findFirst({
      where: {
        id,
        workspaceId: user.workspace.id
      }
    })

    if (!existingItem) {
      return res.status(404).json({ error: 'Inventory item not found' })
    }

    const newQuantity = existingItem.quantity + parseInt(adjustment)

    if (newQuantity < 0) {
      return res.status(400).json({ error: 'Insufficient stock' })
    }

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: {
        quantity: newQuantity
      },
      include: {
        _count: {
          select: {
            usage: true
          }
        }
      }
    })

    res.json({
      success: true,
      data: item,
      message: `Stock ${adjustment > 0 ? 'added' : 'reduced'} successfully`
    })
  } catch (error) {
    console.error('Adjust inventory quantity error:', error)
    res.status(500).json({ error: 'Failed to adjust inventory quantity' })
  }
}

// Get inventory statistics
export const getInventoryStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    const [
      totalItems,
      activeItems,
      allItems
    ] = await Promise.all([
      prisma.inventoryItem.count({
        where: { workspaceId: user.workspace.id }
      }),
      prisma.inventoryItem.count({
        where: { 
          workspaceId: user.workspace.id,
          isActive: true
        }
      }),
      prisma.inventoryItem.findMany({
        where: { workspaceId: user.workspace.id },
        select: {
          quantity: true,
          lowStockThreshold: true
        }
      })
    ])

    const lowStockItems = allItems.filter(item => item.quantity <= item.lowStockThreshold).length
    const outOfStockItems = allItems.filter(item => item.quantity === 0).length
    const totalQuantity = allItems.reduce((sum, item) => sum + item.quantity, 0)

    res.json({
      success: true,
      data: {
        totalItems,
        activeItems,
        inactiveItems: totalItems - activeItems,
        lowStockItems,
        outOfStockItems,
        totalQuantity
      }
    })
  } catch (error) {
    console.error('Get inventory stats error:', error)
    res.status(500).json({ error: 'Failed to fetch inventory statistics' })
  }
}

// Get inventory usage history
export const getInventoryUsage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true }
    })

    if (!user?.workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    // Verify item belongs to workspace
    const item = await prisma.inventoryItem.findFirst({
      where: {
        id,
        workspaceId: user.workspace.id
      }
    })

    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' })
    }

    const usage = await prisma.inventoryUsage.findMany({
      where: {
        inventoryItemId: id
      },
      include: {
        bookingType: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { usedAt: 'desc' }
    })

    res.json({
      success: true,
      data: usage
    })
  } catch (error) {
    console.error('Get inventory usage error:', error)
    res.status(500).json({ error: 'Failed to fetch inventory usage' })
  }
}
