import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto, UpdateStaffDto, SetSalaryDto } from './dto/staff.dto';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.staff.findMany({
      where: search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { user: { email: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true, isActive: true } },
        salary: true,
      },
    });
  }

  async findOne(id: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, isActive: true } },
        salary: true,
        payrolls: { orderBy: [{ year: 'desc' }, { month: 'desc' }], take: 12 },
      },
    });
    if (!staff) throw new NotFoundException('Staff not found');
    return staff;
  }

  async create(dto: CreateStaffDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const hashed = await bcrypt.hash(dto.password, 12);

    // Non-teaching/support staff default to ACCOUNTANT-level access only when ADMIN;
    // all others get an inactive-by-default finance role placeholder for payroll records.
    const role = dto.staffType === 'ADMIN' ? Role.ACCOUNTANT : Role.ACCOUNTANT;

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashed,
        role,
        staff: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            staffType: dto.staffType,
            phone: dto.phone,
            address: dto.address,
            joinDate: dto.joinDate ? new Date(dto.joinDate) : new Date(),
            ...(dto.basicSalary != null && {
              salary: {
                create: {
                  basicSalary: dto.basicSalary,
                  allowances: dto.allowances ?? 0,
                  deductions: dto.deductions ?? 0,
                },
              },
            }),
          },
        },
      },
      include: { staff: { include: { salary: true } } },
    });

    return user.staff;
  }

  async update(id: string, dto: UpdateStaffDto) {
    await this.findOne(id);
    return this.prisma.staff.update({
      where: { id },
      data: dto,
      include: { user: { select: { email: true, isActive: true } }, salary: true },
    });
  }

  async setSalary(id: string, dto: SetSalaryDto) {
    await this.findOne(id);
    return this.prisma.salary.upsert({
      where: { staffId: id },
      create: {
        staffId: id,
        basicSalary: dto.basicSalary,
        allowances: dto.allowances ?? 0,
        deductions: dto.deductions ?? 0,
      },
      update: {
        basicSalary: dto.basicSalary,
        allowances: dto.allowances ?? 0,
        deductions: dto.deductions ?? 0,
      },
    });
  }

  async remove(id: string) {
    const staff = await this.findOne(id);
    return this.prisma.user.update({
      where: { id: staff.userId },
      data: { isActive: false },
    });
  }
}
