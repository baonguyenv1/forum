﻿using System.Collections.Generic;

namespace Dialogue.Logic.Application
{
    public partial class PagedList<T> : List<T>
    {
        public PagedList(IEnumerable<T> source, int pageIndex, int pageSize, int total)
        {
            TotalCount = total;
            if (total > 0 && pageSize > 0)
            {
                TotalPages = total / pageSize;
                if (total%pageSize > 0)
                {
                    TotalPages++;
                }                    
            }            

            PageSize = pageSize;
            PageIndex = pageIndex;
            //AddRange(source.Skip(pageIndex * pageSize).Take(pageSize).ToList());
            AddRange(source);
        }
        public int PageIndex { get; private set; }
        public int PageSize { get; private set; }
        public int TotalCount { get; private set; }
        public int TotalPages { get; private set; }
        public bool HasPreviousPage
        {
            get { return (PageIndex > 0); }
        }
        public bool HasNextPage
        {
            get { return (PageIndex + 1 < TotalPages); }
        }
    }
}