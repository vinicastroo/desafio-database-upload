import { getRepository } from 'typeorm';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import AppError from '../errors/AppError';

import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    if (!(type === 'income' || type === 'outcome')) {
      throw new AppError(
        "The type is wrong, it can be just 'income' or 'outcome'",
      );
    }

    if (type === 'outcome') {
      const transactionsRepository = new TransactionsRepository();

      const balance = await transactionsRepository.getBalance();
      const totalOutcome = balance.outcome + value;

      if (totalOutcome > balance.income) {
        throw new AppError('the outcome cannot be greater than the income');
      }
    }

    const categoryRepository = getRepository(Category);
    const transactionsRepository = getRepository(Transaction);

    let transactionCategory = await categoryRepository.findOne({
      where: { title: category },
    });

    if (!transactionCategory) {
      transactionCategory = categoryRepository.create({
        title: category,
      });

      await categoryRepository.save(transactionCategory);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category: transactionCategory,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
