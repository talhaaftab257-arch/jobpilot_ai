/**
 * CalendarScreen — 100% Native Mobile Interface
 * Interactive monthly schedule grid with interview and application events.
 */
import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView,
  TouchableOpacity
} from 'react-native';
import { colors } from '../theme/colors';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SAMPLE_EVENTS = [
  { id: '1', day: 28, title: 'Technical Interview', time: '10:00 AM PKT', company: 'TechSolutions GmbH', type: 'interview', tag: 'Today' },
  { id: '2', day: 29, title: 'Recruiter Screening Call', time: '04:00 PM PKT', company: 'NextGen AI Labs', type: 'interview', tag: 'Tomorrow' },
  { id: '3', day: 31, title: 'Application Follow-up Window', time: 'All Day', company: 'Falcon Cloud Dubai', type: 'followup', tag: 'Scheduled' },
  { id: '4', day: 3, month: 'Nov', title: 'System Design Round 2', time: '02:30 PM PKT', company: 'Synthetix AI', type: 'interview', tag: 'Upcoming' },
];

export const CalendarScreen: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState(28);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = new Date(year, month, 1).getDay();

  const calendarDays: Array<number | null> = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* ── Month Heading Card ── */}
      <View style={s.calendarCard}>
        <View style={s.calendarHeader}>
          <Text style={s.monthTitle}>{monthName}</Text>
          <View style={s.eventPill}>
            <Text style={s.eventPillText}>2 Interviews This Week</Text>
          </View>
        </View>

        {/* Days of week header */}
        <View style={s.daysOfWeekRow}>
          {DAYS_OF_WEEK.map(d => (
            <Text key={d} style={s.dayOfWeekText}>{d}</Text>
          ))}
        </View>

        {/* Days grid */}
        <View style={s.gridContainer}>
          {calendarDays.map((d, index) => {
            if (d === null) {
              return <View key={`empty-${index}`} style={s.dayCellEmpty} />;
            }

            const hasEvent = [28, 29, 31].includes(d);
            const isSelected = selectedDay === d;

            return (
              <TouchableOpacity
                key={`day-${d}`}
                style={[
                  s.dayCell,
                  isSelected && s.dayCellSelected,
                  hasEvent && !isSelected && s.dayCellWithEvent,
                ]}
                onPress={() => setSelectedDay(d)}
                activeOpacity={0.7}
              >
                <Text style={[
                  s.dayCellNumber,
                  isSelected && s.dayCellNumberSelected,
                  hasEvent && !isSelected && s.dayCellNumberEvent,
                ]}>
                  {d}
                </Text>
                {hasEvent && (
                  <View style={[s.eventDot, isSelected && s.eventDotSelected]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Upcoming Events List ── */}
      <View style={s.eventsSection}>
        <Text style={s.sectionTitle}>Upcoming Schedule</Text>

        <View style={s.eventsList}>
          {SAMPLE_EVENTS.map(ev => {
            const isInterview = ev.type === 'interview';
            return (
              <View key={ev.id} style={s.eventCard}>
                <View style={[s.eventDayBox, { backgroundColor: isInterview ? '#E8F5EE' : '#F5E9ED' }]}>
                  <Text style={[s.eventDayNumber, { color: isInterview ? '#16845B' : colors.primary }]}>
                    {ev.day}
                  </Text>
                  <Text style={[s.eventMonthText, { color: isInterview ? '#16845B' : colors.primary }]}>
                    {ev.month || 'Oct'}
                  </Text>
                </View>

                <View style={s.eventDetails}>
                  <Text style={s.eventTitle}>{ev.title}</Text>
                  <Text style={s.eventCompany}>{ev.company}</Text>
                  <Text style={s.eventTime}>🕐 {ev.time}</Text>
                </View>

                <View style={[s.tagBadge, { backgroundColor: isInterview ? '#FEF5E7' : '#F0EFF0' }]}>
                  <Text style={[s.tagBadgeText, { color: isInterview ? '#B7791F' : '#666' }]}>
                    {ev.tag}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 14,
  },

  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E8EC',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  eventPill: {
    backgroundColor: '#E8F5EE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  eventPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16845B',
  },

  daysOfWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDED',
  },
  dayOfWeekText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },

  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellEmpty: {
    width: '14.28%',
    height: 40,
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
  },
  dayCellWithEvent: {
    backgroundColor: '#F7F4F5',
  },
  dayCellNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  dayCellNumberSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dayCellNumberEvent: {
    color: colors.primary,
    fontWeight: '800',
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 2,
  },
  eventDotSelected: {
    backgroundColor: '#FFFFFF',
  },

  // Events
  eventsSection: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  eventsList: {
    gap: 10,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8EC',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
    gap: 12,
  },
  eventDayBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventDayNumber: {
    fontSize: 16,
    fontWeight: '900',
  },
  eventMonthText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  eventDetails: {
    flex: 1,
    gap: 2,
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  eventCompany: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  eventTime: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
