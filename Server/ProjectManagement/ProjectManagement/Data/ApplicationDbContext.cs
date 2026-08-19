using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Models;
using System.Reflection.Emit;

namespace ProjectManagement.Data;

public class ApplicationDbContext : IdentityDbContext
{
    public ApplicationDbContext(DbContextOptions options) : base(options)
    {

    }
    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Configure ProjectMember entity with composite key
        builder.Entity<ProjectMember>()
            .HasKey(pm => new { pm.ProjectId, pm.UserId });

        builder.Entity<ProjectMember>()
            .HasOne(pm => pm.Project)
            .WithMany(p => p.ProjectMembers)
            .HasForeignKey(pm => pm.ProjectId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<ProjectMember>()
            .HasOne(pm => pm.User)
            .WithMany()
            .HasForeignKey(pm => pm.UserId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<EntityTask>()
            .Property("Rank")
            .UseCollation("Latin1_General_BIN");

        builder.Entity<EntityTask>()
            .HasOne(t => t.Project)
            .WithMany(p => p.Tasks)
            .HasForeignKey(t => t.ProjectId)
            .IsRequired();

        builder.Entity<EntityTask>()
            .HasMany(t => t.Members)
            .WithMany()
            .UsingEntity<UserTasks>();

        builder.Entity<EntityTask>()
            .HasMany(e => e.Files)
            .WithOne(f => f.Task)
            .HasForeignKey(f => f.TaskId)
            .IsRequired();

        builder.Entity<EntityTask>()
            .HasMany(t => t.Comments)
            .WithOne(c => c.Task)
            .HasForeignKey(c => c.TaskId)
            .IsRequired();

        builder.Entity<TaskFiles>()
            .HasOne(tf => tf.User)
            .WithMany()
            .HasForeignKey(tf => tf.UserId)
            .IsRequired();

        builder.Entity<Activity>(entity =>
        {
            entity.ToTable("Activities");

            entity.HasKey(a => a.Id);

            // لتوليد الـ Guid تلقائياً في السيرفر عند الإدخال (SQL Server)
            entity.Property(a => a.Id)
                  .HasDefaultValueSql("NEWID()");

            entity.Property(a => a.ActionType)
                  .HasConversion<string>()
                  .HasMaxLength(50)
                  .IsRequired();

            entity.Property(a => a.EntityType)
                  .HasMaxLength(100)
                  .IsRequired();

            entity.Property(a => a.EntityId)
                  .HasMaxLength(50)
                  .IsRequired();

            entity.Property(a => a.Properties)
                  .HasColumnType("nvarchar(max)");

            entity.Property(a => a.CreatedAt)
                  .HasDefaultValueSql("GETUTCDATE()")
                  .IsRequired();

            // الفهرس الخاص بالمشروع لتسريع الفلترة
            entity.HasIndex(a => a.ProjectId);
        });


        // ==========================================
        // 2. إعدادات جدول الإشعارات (Notifications)
        // ==========================================
        builder.Entity<Notification>(entity =>
        {
            entity.ToTable("Notifications");

            entity.HasKey(n => n.Id);
            entity.Property(n => n.Id).HasDefaultValueSql("NEWID()");

            entity.Property(n => n.NotificationType)
                  .HasConversion<string>()
                  .HasMaxLength(50)
                  .IsRequired();

            entity.Property(n => n.MessageTemplate)
                  .HasMaxLength(255)
                  .IsRequired();

            entity.Property(n => n.CreatedAt)
                  .HasDefaultValueSql("GETUTCDATE()")
                  .IsRequired();

            // علاقة One-to-One بين الإشعار والنشاط
            entity.HasOne(n => n.Activity)
                  .WithOne(a => a.Notification)
                  .HasForeignKey<Notification>(n => n.ActivityId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<UserNotification>(entity =>
        {
            entity.ToTable("UserNotifications");

            entity.HasKey(un => un.Id);
            entity.Property(un => un.Id).HasDefaultValueSql("NEWID()");

            entity.Property(un => un.IsRead)
                  .HasDefaultValue(false)
                  .IsRequired();

            // علاقة One-to-Many بين الإشعار العام وإشعارات المستخدمين
            entity.HasOne(un => un.Notification)
                  .WithMany(n => n.UserNotifications)
                  .HasForeignKey(un => un.NotificationId)
                  .OnDelete(DeleteBehavior.Cascade);

            // 🚀 الفهرس المركب فائق الأهمية لجلب الإشعارات غير المقروءة بسرعة
            entity.HasIndex(un => new { un.UserId, un.IsRead });
        });
    }

    internal async Task FindAsync(int projectId)
    {
        throw new NotImplementedException();
    }

    public DbSet<User> Users { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    public DbSet<Project> Projects { get; set; }
    public DbSet<EntityTask> Tasks { get; set; }
    public DbSet<ProjectMember> ProjectMembers { get; set; }
    public DbSet<UserTasks> UserTasks { get; set; }
    public DbSet<Comment> Comments { get; set; }
    public DbSet<TaskFiles> TaskFiles { get; set; }
    public DbSet<Activity> Activities { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<UserNotification> UserNotifications { get; set; }
}
